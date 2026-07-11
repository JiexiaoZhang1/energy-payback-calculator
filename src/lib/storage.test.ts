import { beforeEach, describe, expect, it } from "vitest";
import { defaultTariffBlocks } from "./defaults";
import { loadState, saveState } from "./storage";
import type { CalculatorState } from "./types";

const storageKey = "energy-payback-calculator:v1";

describe("storage migrations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("moves legacy saved tariffs back to the default negative / low / high example", () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        currency: "USD",
        tariffBlocks: [
          { id: "test-a", startHour: 0, endHour: 6, pricePerKwh: -0.55 },
          { id: "test-b", startHour: 6, endHour: 10, pricePerKwh: 0.35 },
          { id: "test-c", startHour: 10, endHour: 12, pricePerKwh: -0.75 },
          { id: "test-d", startHour: 12, endHour: 17, pricePerKwh: 0.35 },
          { id: "test-e", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
        ],
        advanced: { batteryEfficiency: 0.9 },
      }),
    );

    const state = loadState();

    expect(state.currency).toBe("USD");
    expect(state.advanced.batteryEfficiency).toBe(0.95);
    expect(state.tariffBlocks).toEqual(
      defaultTariffBlocks.map((block) =>
        expect.objectContaining({
          startHour: block.startHour,
          endHour: block.endHour,
          pricePerKwh: block.pricePerKwh,
        }),
      ),
    );
  });

  it("keeps user-edited tariffs after the current preset version is saved", () => {
    const customState: CalculatorState = {
      ...loadState(),
      tariffBlocks: [
        { id: "custom", startHour: 0, endHour: 24, pricePerKwh: 0.22 },
      ],
    };

    saveState(customState);

    expect(loadState().tariffBlocks).toEqual([
      expect.objectContaining({ startHour: 0, endHour: 24, pricePerKwh: 0.22 }),
    ]);
  });
});
