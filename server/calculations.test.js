import { describe, expect, it } from "vitest";
import { calculateSavings } from "./calculations.js";

describe("server calculations", () => {
  it("returns a backend payback estimate for the default tariff shape", () => {
    const result = calculateSavings({
      tariffBlocks: [
        { id: "night", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
        { id: "day", startHour: 6, endHour: 17, pricePerKwh: 0.35 },
        { id: "peak", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
      ],
      assets: {
        battery: { enabled: true, value: 10, cost: 0 },
        heat: { enabled: true, value: 8, cost: 0 },
        ev: { enabled: true, value: 50, cost: 0 },
        appliance: { enabled: true, value: 2, cost: 0 },
      },
      totalCost: 30000,
      advanced: { batteryEfficiency: 0.9, batteryCyclesPerDay: 1, heatPumpCop: 3 },
    });

    expect(result.annualSavings).toBeGreaterThan(11000);
    expect(result.paybackYears).toBeGreaterThan(2);
    expect(result.paybackYears).toBeLessThan(3);
    expect(result.contributions.heat.avoidedRate).toBeGreaterThan(result.averageRate);
    expect(result.contributions.ev.avoidedRate).toBeGreaterThan(result.averageRate);
    expect(result.contributions.appliance.avoidedRate).toBeGreaterThan(result.averageRate);
  });

  it("counts negative price windows as real savings for flexible loads", () => {
    const result = calculateSavings({
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
      totalCost: 1000,
      advanced: { batteryEfficiency: 0.95, batteryCyclesPerDay: 1, heatPumpCop: 3 },
    });

    expect(result.contributions.appliance.lowRate).toBe(-0.5);
    expect(result.contributions.appliance.avoidedRate).toBe(1);
    expect(result.contributions.appliance.annualSavings).toBeCloseTo(2 * 1.5 * 365);
    expect(result.paybackYears).toBeCloseTo(1000 / (2 * 1.5 * 365));
  });

  it("keeps maximum battery capacity profitable under a negative-low-high tariff", () => {
    const result = calculateSavings({
      tariffBlocks: [
        { id: "negative", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
        { id: "low", startHour: 6, endHour: 17, pricePerKwh: 0.35 },
        { id: "high", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
      ],
      assets: {
        battery: { enabled: true, value: 30, cost: 0 },
        heat: { enabled: false, value: 8, cost: 0 },
        ev: { enabled: false, value: 50, cost: 0 },
        appliance: { enabled: false, value: 2, cost: 0 },
      },
      totalCost: 30000,
      advanced: { batteryEfficiency: 0.95, batteryCyclesPerDay: 1, heatPumpCop: 3 },
    });

    expect(result.contributions.battery.lowRate).toBeCloseTo(-0.2);
    expect(result.contributions.battery.avoidedRate).toBeCloseTo(1.2);
    expect(result.contributions.battery.annualSavings).toBeGreaterThan(15000);
    expect(result.paybackYears).toBeLessThan(2);
  });

  it("uses enabled asset split costs for payback when provided", () => {
    const result = calculateSavings({
      tariffBlocks: [
        { id: "negative", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
        { id: "low", startHour: 6, endHour: 17, pricePerKwh: 0.35 },
        { id: "high", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
      ],
      assets: {
        battery: { enabled: true, value: 10, cost: 50000 },
        heat: { enabled: false, value: 8, cost: 999999 },
        ev: { enabled: false, value: 50, cost: 0 },
        appliance: { enabled: false, value: 2, cost: 0 },
      },
      totalCost: 0,
      advanced: { batteryEfficiency: 0.95, batteryCyclesPerDay: 1, heatPumpCop: 3 },
    });

    expect(result.investmentCost).toBe(50000);
    expect(result.paybackYears).toBeCloseTo(50000 / result.annualSavings);
  });
});
