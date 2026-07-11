import type {
  AssetContribution,
  AssetKey,
  CalculatorState,
  CalculationResult,
  TariffBlock,
} from "./types";

const hoursPerDay = 24;
const defaultFlexiblePowerKw = 5;
const maxOptimizationWindowHours = 6;

export function normalizeHour(hour: number): number {
  if (!Number.isFinite(hour)) return 0;
  return Math.max(0, Math.min(24, Math.round(hour)));
}

export function normalizeTariffBlock(block: TariffBlock): TariffBlock {
  const startHour = Math.min(23, normalizeHour(block.startHour));
  const endHour = Math.max(startHour + 1, normalizeHour(block.endHour));
  return {
    ...block,
    startHour,
    endHour: Math.min(24, endHour),
    pricePerKwh: Number.isFinite(block.pricePerKwh) ? block.pricePerKwh : 0,
  };
}

export function expandTariffBlocks(
  blocks: TariffBlock[],
  fallbackPrice = 0.3,
): number[] {
  const prices = Array.from({ length: hoursPerDay }, () => fallbackPrice);
  blocks.map(normalizeTariffBlock).forEach((block) => {
    for (let hour = block.startHour; hour < block.endHour; hour += 1) {
      prices[hour] = block.pricePerKwh;
    }
  });
  return prices;
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function weightedRateByPrice(
  prices: number[],
  energyKwh: number,
  mode: "cheapest" | "expensive",
): number {
  if (energyKwh <= 0) return average(prices);
  const sorted = [...prices].sort((a, b) =>
    mode === "cheapest" ? a - b : b - a,
  );
  let remaining = energyKwh;
  let weightedTotal = 0;
  let consumed = 0;

  for (const price of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(1, remaining);
    weightedTotal += price * take;
    consumed += take;
    remaining -= take;
  }

  if (remaining > 0) {
    const avg = average(prices);
    weightedTotal += avg * remaining;
    consumed += remaining;
  }

  return consumed > 0 ? weightedTotal / consumed : average(prices);
}

export function optimizedWindowRateByPrice(
  prices: number[],
  energyKwh: number,
  mode: "cheapest" | "expensive",
  flexiblePowerKw = defaultFlexiblePowerKw,
): number {
  if (!prices.length) return 0;
  if (energyKwh <= 0) return average(prices);

  const hoursNeeded = Math.max(
    1,
    Math.min(
      prices.length,
      maxOptimizationWindowHours,
      Math.ceil(energyKwh / Math.max(0.1, flexiblePowerKw)),
    ),
  );
  const sorted = [...prices].sort((a, b) =>
    mode === "cheapest" ? a - b : b - a,
  );

  return average(sorted.slice(0, hoursNeeded));
}

function topHours(prices: number[], mode: "cheapest" | "expensive", count = 6): number[] {
  return prices
    .map((price, hour) => ({ hour, price }))
    .sort((a, b) => (mode === "cheapest" ? a.price - b.price : b.price - a.price))
    .slice(0, count)
    .map((item) => item.hour)
    .sort((a, b) => a - b);
}

function emptyContribution(key: AssetKey): AssetContribution {
  return {
    key,
    annualSavings: 0,
    dailyFlexibleKwh: 0,
    lowRate: 0,
    avoidedRate: 0,
  };
}

function investmentCost(state: CalculatorState): number {
  const enabledSplitCost = Object.values(state.assets).reduce((sum, asset) => {
    if (!asset.enabled) return sum;
    return sum + Math.max(0, Number.isFinite(asset.cost) ? asset.cost : 0);
  }, 0);

  return enabledSplitCost > 0 ? enabledSplitCost : Math.max(0, state.totalCost);
}

export function calculateSavings(state: CalculatorState): CalculationResult {
  const hourlyPrices = expandTariffBlocks(state.tariffBlocks);
  const averageRate = average(hourlyPrices);
  const paybackCost = investmentCost(state);
  const contributions: Record<AssetKey, AssetContribution> = {
    battery: emptyContribution("battery"),
    heat: emptyContribution("heat"),
    ev: emptyContribution("ev"),
    appliance: emptyContribution("appliance"),
  };

  const battery = state.assets.battery;
  if (battery.enabled && battery.value > 0) {
    const dailyDischargeKwh =
      battery.value * Math.max(0, state.advanced.batteryCyclesPerDay);
    const efficiency = Math.max(0.01, state.advanced.batteryEfficiency);
    const dailyChargeKwh = dailyDischargeKwh / efficiency;
    const lowRate = optimizedWindowRateByPrice(hourlyPrices, dailyChargeKwh, "cheapest");
    const avoidedRate = optimizedWindowRateByPrice(hourlyPrices, dailyDischargeKwh, "expensive");
    const effectiveChargeRate =
      lowRate / efficiency;
    contributions.battery = {
      key: "battery",
      annualSavings: dailyDischargeKwh * Math.max(0, avoidedRate - effectiveChargeRate) * 365,
      dailyFlexibleKwh: dailyDischargeKwh,
      lowRate,
      avoidedRate,
    };
  }

  const heat = state.assets.heat;
  if (heat.enabled && heat.value > 0) {
    const dailyElectricKwh = heat.value / Math.max(0.1, state.advanced.heatPumpCop);
    const lowRate = optimizedWindowRateByPrice(hourlyPrices, dailyElectricKwh, "cheapest");
    const avoidedRate = optimizedWindowRateByPrice(hourlyPrices, dailyElectricKwh, "expensive");
    contributions.heat = {
      key: "heat",
      annualSavings: dailyElectricKwh * Math.max(0, avoidedRate - lowRate) * 365,
      dailyFlexibleKwh: dailyElectricKwh,
      lowRate,
      avoidedRate,
    };
  }

  const ev = state.assets.ev;
  if (ev.enabled && ev.value > 0) {
    const dailyChargeKwh = ev.value / 7;
    const lowRate = optimizedWindowRateByPrice(hourlyPrices, dailyChargeKwh, "cheapest");
    const avoidedRate = optimizedWindowRateByPrice(hourlyPrices, dailyChargeKwh, "expensive");
    contributions.ev = {
      key: "ev",
      annualSavings: ev.value * Math.max(0, avoidedRate - lowRate) * 52,
      dailyFlexibleKwh: dailyChargeKwh,
      lowRate,
      avoidedRate,
    };
  }

  const appliance = state.assets.appliance;
  if (appliance.enabled && appliance.value > 0) {
    const lowRate = optimizedWindowRateByPrice(hourlyPrices, appliance.value, "cheapest");
    const avoidedRate = optimizedWindowRateByPrice(hourlyPrices, appliance.value, "expensive");
    contributions.appliance = {
      key: "appliance",
      annualSavings: appliance.value * Math.max(0, avoidedRate - lowRate) * 365,
      dailyFlexibleKwh: appliance.value,
      lowRate,
      avoidedRate,
    };
  }

  const annualSavings = Object.values(contributions).reduce(
    (sum, contribution) => sum + contribution.annualSavings,
    0,
  );
  const paybackYears =
    annualSavings > 0 && paybackCost > 0 ? paybackCost / annualSavings : null;

  return {
    hourlyPrices,
    annualSavings,
    paybackYears,
    investmentCost: paybackCost,
    contributions,
    cheapHours: topHours(hourlyPrices, "cheapest", 6),
    expensiveHours: topHours(hourlyPrices, "expensive", 6),
    averageRate,
  };
}
