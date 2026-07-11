import { defaultState } from "./defaults";
import { normalizeTariffBlocksForEditing } from "./tariffEditor";
import type { CalculatorState } from "./types";

const storageKey = "energy-payback-calculator:v1";
const tariffPresetVersion = 2;
type StoredCalculatorState = Partial<CalculatorState> & {
  tariffPresetVersion?: number;
};

export function loadState(): CalculatorState {
  if (typeof localStorage === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as StoredCalculatorState;
    const advanced = {
      ...defaultState.advanced,
      ...parsed.advanced,
    };
    if (advanced.batteryEfficiency === 0.9) {
      advanced.batteryEfficiency = defaultState.advanced.batteryEfficiency;
    }
    const tariffBlocks =
      parsed.tariffPresetVersion === tariffPresetVersion && parsed.tariffBlocks?.length
        ? parsed.tariffBlocks
        : defaultState.tariffBlocks;
    return {
      ...defaultState,
      ...parsed,
      assets: {
        ...defaultState.assets,
        ...parsed.assets,
      },
      advanced,
      tariffBlocks: normalizeTariffBlocksForEditing(tariffBlocks),
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: CalculatorState): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify({ ...state, tariffPresetVersion }));
}
