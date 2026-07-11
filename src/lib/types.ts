export type Language = "zh-CN" | "en" | "de" | "fr" | "it";

export type CurrencyCode =
  | "CNY"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "NZD"
  | "CAD"
  | "JPY";

export type AssetKey = "battery" | "heat" | "ev" | "appliance";

export interface TariffBlock {
  id: string;
  startHour: number;
  endHour: number;
  pricePerKwh: number;
}

export interface AssetConfig {
  enabled: boolean;
  value: number;
  cost: number;
}

export interface AdvancedConfig {
  batteryEfficiency: number;
  batteryCyclesPerDay: number;
  heatPumpCop: number;
}

export interface CalculatorState {
  language: Language;
  currency: CurrencyCode;
  tariffBlocks: TariffBlock[];
  assets: Record<AssetKey, AssetConfig>;
  totalCost: number;
  advanced: AdvancedConfig;
}

export interface AssetContribution {
  key: AssetKey;
  annualSavings: number;
  dailyFlexibleKwh: number;
  lowRate: number;
  avoidedRate: number;
}

export interface CalculationResult {
  hourlyPrices: number[];
  annualSavings: number;
  paybackYears: number | null;
  investmentCost: number;
  contributions: Record<AssetKey, AssetContribution>;
  cheapHours: number[];
  expensiveHours: number[];
  averageRate: number;
}
