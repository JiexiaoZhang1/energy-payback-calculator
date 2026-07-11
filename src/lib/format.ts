import type { CurrencyCode, Language } from "./types";

const localeByLanguage: Record<Language, string> = {
  "zh-CN": "zh-CN",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  it: "it-IT",
};

export function formatMoney(
  amount: number,
  language: Language,
  currency: CurrencyCode,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(localeByLanguage[language], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 0,
    ...options,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(
  value: number,
  language: Language,
  maximumFractionDigits = 1,
): string {
  return new Intl.NumberFormat(localeByLanguage[language], {
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatHour(hour: number): string {
  const rounded = Math.round(hour);
  if (rounded >= 24) return "24:00";
  const safeHour = Math.max(0, rounded);
  return `${safeHour.toString().padStart(2, "0")}:00`;
}
