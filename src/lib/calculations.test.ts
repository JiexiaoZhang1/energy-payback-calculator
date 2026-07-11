import { describe, expect, it } from "vitest";
import { defaultState } from "./defaults";
import {
  calculateSavings,
  expandTariffBlocks,
  optimizedWindowRateByPrice,
  weightedRateByPrice,
} from "./calculations";
import type { AssetKey, CalculatorState, TariffBlock } from "./types";

describe("tariff expansion", () => {
  it("expands blocks into 24 hourly prices and allows negative prices", () => {
    const prices = expandTariffBlocks([
      { id: "a", startHour: 0, endHour: 2, pricePerKwh: -0.15 },
      { id: "b", startHour: 2, endHour: 4, pricePerKwh: 0.8 },
    ]);

    expect(prices).toHaveLength(24);
    expect(prices[0]).toBe(-0.15);
    expect(prices[3]).toBe(0.8);
    expect(prices[4]).toBe(0.3);
  });

  it("normalizes invalid end hours so a block covers at least one hour", () => {
    const prices = expandTariffBlocks([
      { id: "a", startHour: 5, endHour: 5, pricePerKwh: 0.1 },
    ]);

    expect(prices[5]).toBe(0.1);
    expect(prices[6]).toBe(0.3);
  });
});

describe("weighted rates", () => {
  it("uses the cheapest or most expensive hours first", () => {
    const prices = [0.9, -0.2, 0.4, 1.2];

    expect(weightedRateByPrice(prices, 2, "cheapest")).toBeCloseTo(0.1);
    expect(weightedRateByPrice(prices, 2, "expensive")).toBeCloseTo(1.05);
  });

  it("uses optimization windows instead of treating each hour as only 1 kWh", () => {
    const prices = expandTariffBlocks(defaultState.tariffBlocks);

    expect(optimizedWindowRateByPrice(prices, 30, "cheapest")).toBeCloseTo(-0.2);
    expect(optimizedWindowRateByPrice(prices, 30, "expensive")).toBeCloseTo(1.2);
  });
});

describe("savings calculation", () => {
  it("calculates positive battery savings when negative and high prices coexist", () => {
    const state: CalculatorState = {
      ...defaultState,
      totalCost: 30000,
      assets: {
        battery: { enabled: true, value: 10, cost: 0 },
        heat: { enabled: false, value: 8, cost: 0 },
        ev: { enabled: false, value: 50, cost: 0 },
        appliance: { enabled: false, value: 2, cost: 0 },
      },
      tariffBlocks: [
        { id: "negative", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
        { id: "flat", startHour: 6, endHour: 17, pricePerKwh: 0.35 },
        { id: "peak", startHour: 17, endHour: 23, pricePerKwh: 1.2 },
      ],
    };

    const result = calculateSavings(state);

    expect(result.contributions.battery.annualSavings).toBeGreaterThan(0);
    expect(result.annualSavings).toBeGreaterThan(0);
    expect(result.paybackYears).not.toBeNull();
  });

  it("keeps battery savings positive and increasing up to the maximum capacity", () => {
    const capacities = [1, 5, 10, 20, 30];
    const savings = capacities.map((capacity) => {
      const result = calculateSavings({
        ...defaultState,
        assets: onlyAsset("battery", capacity),
      });
      return result.contributions.battery.annualSavings;
    });

    expect(savings[0]).toBeGreaterThan(0);
    expect(savings[4]).toBeGreaterThan(savings[0]);
    expect(savings[4]).toBeGreaterThan(0);
    expect(isNonDecreasing(savings)).toBe(true);
  });

  it("returns no payback when there is no useful price spread", () => {
    const state: CalculatorState = {
      ...defaultState,
      tariffBlocks: [{ id: "flat", startHour: 0, endHour: 24, pricePerKwh: 0.3 }],
      assets: {
        battery: { enabled: true, value: 10, cost: 0 },
        heat: { enabled: true, value: 8, cost: 0 },
        ev: { enabled: true, value: 50, cost: 0 },
        appliance: { enabled: true, value: 2, cost: 0 },
      },
    };

    const result = calculateSavings(state);

    expect(result.annualSavings).toBe(0);
    expect(result.paybackYears).toBeNull();
  });

  it("annualizes heat, EV and appliance savings", () => {
    const state: CalculatorState = {
      ...defaultState,
      assets: {
        battery: { enabled: false, value: 10, cost: 0 },
        heat: { enabled: true, value: 12, cost: 0 },
        ev: { enabled: true, value: 70, cost: 0 },
        appliance: { enabled: true, value: 3, cost: 0 },
      },
    };

    const result = calculateSavings(state);

    expect(result.contributions.heat.annualSavings).toBeGreaterThan(0);
    expect(result.contributions.ev.annualSavings).toBeGreaterThan(0);
    expect(result.contributions.appliance.annualSavings).toBeGreaterThan(0);
  });

  it("uses high-price avoided rates for shiftable heat, EV and appliance loads", () => {
    const state: CalculatorState = {
      ...defaultState,
      totalCost: 30000,
      tariffBlocks: [
        { id: "negative", startHour: 0, endHour: 4, pricePerKwh: -0.4 },
        { id: "low", startHour: 4, endHour: 16, pricePerKwh: 0.2 },
        { id: "high", startHour: 16, endHour: 24, pricePerKwh: 1.1 },
      ],
      assets: {
        battery: { enabled: false, value: 10, cost: 0 },
        heat: { enabled: true, value: 9, cost: 0 },
        ev: { enabled: true, value: 35, cost: 0 },
        appliance: { enabled: true, value: 2, cost: 0 },
      },
    };

    const result = calculateSavings(state);

    for (const key of ["heat", "ev", "appliance"] as const) {
      expect(result.contributions[key].avoidedRate).toBeGreaterThan(result.averageRate);
      expect(result.contributions[key].lowRate).toBeLessThan(result.averageRate);
      expect(result.contributions[key].annualSavings).toBeGreaterThan(0);
    }
  });

  it("counts negative-price charging as additional arbitrage value", () => {
    const state: CalculatorState = {
      ...defaultState,
      totalCost: 1000,
      tariffBlocks: [
        { id: "negative", startHour: 0, endHour: 2, pricePerKwh: -0.5 },
        { id: "flat", startHour: 2, endHour: 20, pricePerKwh: 0.2 },
        { id: "peak", startHour: 20, endHour: 24, pricePerKwh: 1 },
      ],
      assets: {
        battery: { enabled: false, value: 10, cost: 0 },
        heat: { enabled: false, value: 8, cost: 0 },
        ev: { enabled: false, value: 50, cost: 0 },
        appliance: { enabled: true, value: 2, cost: 0 },
      },
    };

    const result = calculateSavings(state);

    expect(result.contributions.appliance.lowRate).toBe(-0.5);
    expect(result.contributions.appliance.avoidedRate).toBe(1);
    expect(result.contributions.appliance.annualSavings).toBeCloseTo(2 * 1.5 * 365);
    expect(result.paybackYears).toBeCloseTo(1000 / (2 * 1.5 * 365));
  });

  it("sweeps every adjustable numeric input across ten values", () => {
    const sweeps: {
      label: string;
      values: number[];
      read: (result: ReturnType<typeof calculateSavings>) => number | null;
      makeState: (value: number) => CalculatorState;
      trend?: "up" | "down";
    }[] = [
      {
        label: "negative price",
        values: [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.1, 0.2, 0.3, 0.35],
        makeState: (price) => ({
          ...defaultState,
          tariffBlocks: withTariffPrice("negative", price),
        }),
        read: (result) => result.annualSavings,
        trend: "down",
      },
      {
        label: "low price",
        values: [0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8],
        makeState: (price) => ({
          ...defaultState,
          tariffBlocks: [
            { id: "negative", startHour: 0, endHour: 6, pricePerKwh: 0.9 },
            { id: "low", startHour: 6, endHour: 17, pricePerKwh: price },
            { id: "high", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
          ],
        }),
        read: (result) => result.annualSavings,
        trend: "down",
      },
      {
        label: "high price",
        values: [0.35, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 1.8, 2.2],
        makeState: (price) => ({
          ...defaultState,
          tariffBlocks: withTariffPrice("high", price),
        }),
        read: (result) => result.annualSavings,
        trend: "up",
      },
      {
        label: "negative period length",
        values: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16],
        makeState: (hours) => ({
          ...defaultState,
          tariffBlocks: [
            { id: "negative", startHour: 0, endHour: hours, pricePerKwh: -0.2 },
            { id: "low", startHour: hours, endHour: 17, pricePerKwh: 0.35 },
            { id: "high", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
          ],
        }),
        read: (result) => result.annualSavings,
        trend: "up",
      },
      {
        label: "high period length",
        values: [1, 2, 3, 4, 5, 6, 7, 9, 12, 16],
        makeState: (hours) => ({
          ...defaultState,
          tariffBlocks: [
            { id: "negative", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
            { id: "low", startHour: 6, endHour: 24 - hours, pricePerKwh: 0.35 },
            { id: "high", startHour: 24 - hours, endHour: 24, pricePerKwh: 1.2 },
          ],
        }),
        read: (result) => result.annualSavings,
        trend: "up",
      },
      {
        label: "negative period start",
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        makeState: (startHour) => ({
          ...defaultState,
          tariffBlocks: movingNegativeWindow(startHour),
        }),
        read: (result) => result.annualSavings,
      },
      {
        label: "high period start",
        values: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22],
        makeState: (startHour) => ({
          ...defaultState,
          tariffBlocks: highWindowFrom(startHour),
        }),
        read: (result) => result.annualSavings,
        trend: "down",
      },
      {
        label: "battery capacity",
        values: [1, 3, 5, 8, 10, 15, 20, 24, 28, 30],
        makeState: (value) => ({
          ...defaultState,
          assets: onlyAsset("battery", value),
        }),
        read: (result) => result.contributions.battery.annualSavings,
        trend: "up",
      },
      {
        label: "heat load",
        values: [1, 4, 8, 12, 16, 24, 30, 40, 50, 60],
        makeState: (value) => ({
          ...defaultState,
          assets: onlyAsset("heat", value),
        }),
        read: (result) => result.contributions.heat.annualSavings,
        trend: "up",
      },
      {
        label: "EV charging",
        values: [0, 15, 30, 50, 70, 90, 105, 120, 130, 140],
        makeState: (value) => ({
          ...defaultState,
          assets: onlyAsset("ev", value),
        }),
        read: (result) => result.contributions.ev.annualSavings,
        trend: "up",
      },
      {
        label: "timed appliance",
        values: [0, 1, 2, 3, 5, 8, 10, 12, 16, 20],
        makeState: (value) => ({
          ...defaultState,
          assets: onlyAsset("appliance", value),
        }),
        read: (result) => result.contributions.appliance.annualSavings,
        trend: "up",
      },
      {
        label: "total cost",
        values: [0, 5000, 10000, 20000, 30000, 45000, 60000, 80000, 100000, 120000],
        makeState: (value) => ({
          ...defaultState,
          totalCost: value,
        }),
        read: (result) => result.paybackYears,
        trend: "up",
      },
      ...(["battery", "heat", "ev", "appliance"] as const).map((key) => ({
        label: `${key} split cost`,
        values: [0, 2500, 5000, 7500, 10000, 15000, 20000, 30000, 40000, 60000],
        makeState: (value: number) => ({
          ...defaultState,
          totalCost: 0,
          assets: onlyAssetWithCost(key, defaultState.assets[key].value, value),
        }),
        read: (result: ReturnType<typeof calculateSavings>) => result.paybackYears,
        trend: "up" as const,
      })),
      {
        label: "battery efficiency on positive low price",
        values: [0.5, 0.55, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.97, 0.98],
        makeState: (value) => ({
          ...defaultState,
          tariffBlocks: [
            { id: "low", startHour: 0, endHour: 6, pricePerKwh: 0.2 },
            { id: "mid", startHour: 6, endHour: 17, pricePerKwh: 0.35 },
            { id: "high", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
          ],
          assets: onlyAsset("battery", 10),
          advanced: { ...defaultState.advanced, batteryEfficiency: value },
        }),
        read: (result) => result.contributions.battery.annualSavings,
        trend: "up",
      },
      {
        label: "battery cycles",
        values: [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.5, 1.8, 2],
        makeState: (value) => ({
          ...defaultState,
          assets: onlyAsset("battery", 10),
          advanced: { ...defaultState.advanced, batteryCyclesPerDay: value },
        }),
        read: (result) => result.contributions.battery.annualSavings,
        trend: "up",
      },
      {
        label: "heat pump COP",
        values: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6],
        makeState: (value) => ({
          ...defaultState,
          assets: onlyAsset("heat", 18),
          advanced: { ...defaultState.advanced, heatPumpCop: value },
        }),
        read: (result) => result.contributions.heat.annualSavings,
        trend: "down",
      },
    ];

    for (const sweep of sweeps) {
      expect(sweep.values, sweep.label).toHaveLength(10);
      const observed = sweep.values.map((value) => sweep.read(calculateSavings(sweep.makeState(value))));

      for (const value of observed) {
        if (value !== null) {
          expect(Number.isFinite(value), sweep.label).toBe(true);
          expect(value, sweep.label).toBeGreaterThanOrEqual(0);
        }
      }

      if (sweep.trend === "up") {
        expect(isNonDecreasing(observed), sweep.label).toBe(true);
      }
      if (sweep.trend === "down") {
        expect(isNonIncreasing(observed), sweep.label).toBe(true);
      }
    }
  });
});

function onlyAsset(key: AssetKey, value: number): CalculatorState["assets"] {
  return {
    battery: { enabled: key === "battery", value: key === "battery" ? value : 10, cost: 0 },
    heat: { enabled: key === "heat", value: key === "heat" ? value : 8, cost: 0 },
    ev: { enabled: key === "ev", value: key === "ev" ? value : 50, cost: 0 },
    appliance: { enabled: key === "appliance", value: key === "appliance" ? value : 2, cost: 0 },
  };
}

function onlyAssetWithCost(
  key: AssetKey,
  value: number,
  cost: number,
): CalculatorState["assets"] {
  const assets = onlyAsset(key, value);
  assets[key] = { ...assets[key], cost };
  return assets;
}

function withTariffPrice(id: TariffBlock["id"], pricePerKwh: number): TariffBlock[] {
  return defaultState.tariffBlocks.map((block) =>
    block.id === id ? { ...block, pricePerKwh } : block,
  );
}

function movingNegativeWindow(startHour: number): TariffBlock[] {
  return [
    { id: "before", startHour: 0, endHour: startHour, pricePerKwh: 0.35 },
    { id: "negative", startHour, endHour: startHour + 3, pricePerKwh: -0.2 },
    { id: "low", startHour: startHour + 3, endHour: 17, pricePerKwh: 0.35 },
    { id: "high", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
  ].filter(hasPositiveDuration);
}

function highWindowFrom(startHour: number): TariffBlock[] {
  return [
    { id: "negative", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
    { id: "low", startHour: 6, endHour: startHour, pricePerKwh: 0.35 },
    { id: "high", startHour, endHour: 24, pricePerKwh: 1.2 },
  ].filter(hasPositiveDuration);
}

function hasPositiveDuration(block: TariffBlock): boolean {
  return block.endHour > block.startHour;
}

function isNonDecreasing(values: Array<number | null>): boolean {
  return values.every((value, index) => {
    if (index === 0 || value === null) return true;
    const previous = values[index - 1];
    return previous === null || value >= previous;
  });
}

function isNonIncreasing(values: Array<number | null>): boolean {
  return values.every((value, index) => {
    if (index === 0 || value === null) return true;
    const previous = values[index - 1];
    return previous === null || value <= previous;
  });
}
