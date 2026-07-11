import type { CalculatorState, CurrencyCode, Language } from "./types";

export const languages: { code: Language; label: string; nativeName: string }[] = [
  { code: "zh-CN", label: "中文", nativeName: "中文" },
  { code: "en", label: "English", nativeName: "English" },
  { code: "de", label: "Deutsch", nativeName: "Deutsch" },
  { code: "fr", label: "Français", nativeName: "Français" },
  { code: "it", label: "Italiano", nativeName: "Italiano" },
];

export const currencies: CurrencyCode[] = [
  "CNY",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "NZD",
  "CAD",
  "JPY",
];

export const defaultTariffBlocks = [
  { id: "negative", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
  { id: "low", startHour: 6, endHour: 17, pricePerKwh: 0.35 },
  { id: "high", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
];

export function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "zh-CN";
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith("zh")) return "zh-CN";
  if (browserLanguage.startsWith("de")) return "de";
  if (browserLanguage.startsWith("fr")) return "fr";
  if (browserLanguage.startsWith("it")) return "it";
  return "en";
}

export const defaultState: CalculatorState = {
  language: detectLanguage(),
  currency: "CNY",
  tariffBlocks: defaultTariffBlocks,
  assets: {
    battery: { enabled: true, value: 10, cost: 0 },
    heat: { enabled: true, value: 8, cost: 0 },
    ev: { enabled: true, value: 50, cost: 0 },
    appliance: { enabled: true, value: 2, cost: 0 },
  },
  totalCost: 30000,
  advanced: {
    batteryEfficiency: 0.95,
    batteryCyclesPerDay: 1,
    heatPumpCop: 3,
  },
};
