import type { CalculatorState, CalculationResult } from "./types";

export type Scenario = {
  id: string;
  createdAt: string;
  state: CalculatorState;
  result: CalculationResult;
};

const apiBase =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:8787" : "");

export async function calculateOnServer(
  state: CalculatorState,
): Promise<CalculationResult> {
  const response = await fetch(`${apiBase}/api/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
  if (!response.ok) {
    throw new Error("calculate failed");
  }
  const payload = (await response.json()) as { result: CalculationResult };
  return payload.result;
}

export async function saveScenario(
  state: CalculatorState,
  result: CalculationResult,
): Promise<Scenario> {
  const response = await fetch(`${apiBase}/api/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, result }),
  });
  if (!response.ok) {
    throw new Error("save scenario failed");
  }
  const payload = (await response.json()) as { scenario: Scenario };
  return payload.scenario;
}

export async function loadScenario(id: string): Promise<Scenario> {
  const response = await fetch(`${apiBase}/api/scenarios/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error("load scenario failed");
  }
  const payload = (await response.json()) as { scenario: Scenario };
  return payload.scenario;
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}
