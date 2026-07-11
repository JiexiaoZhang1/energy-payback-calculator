import type { AssetKey } from "./types";

export type AssetMeta = {
  key: AssetKey;
  color: string;
  min: number;
  max: number;
  step: number;
  period: "perDay" | "perWeek" | "";
};

export const assetMetas: AssetMeta[] = [
  {
    key: "battery",
    color: "#2f80ed",
    min: 1,
    max: 30,
    step: 1,
    period: "",
  },
  {
    key: "heat",
    color: "#f97316",
    min: 1,
    max: 60,
    step: 1,
    period: "perDay",
  },
  {
    key: "ev",
    color: "#16a34a",
    min: 0,
    max: 140,
    step: 5,
    period: "perWeek",
  },
  {
    key: "appliance",
    color: "#8b5cf6",
    min: 0,
    max: 20,
    step: 0.5,
    period: "perDay",
  },
];
