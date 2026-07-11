import { describe, expect, it } from "vitest";
import { formatHour, formatMoney } from "./format";
import { currencies, languages } from "./defaults";

describe("format helpers", () => {
  it("keeps the final day boundary as 24:00", () => {
    expect(formatHour(0)).toBe("00:00");
    expect(formatHour(23)).toBe("23:00");
    expect(formatHour(24)).toBe("24:00");
  });

  it("formats selected currencies using the selected locale", () => {
    expect(formatMoney(5981, "zh-CN", "CNY")).toContain("¥");
    expect(formatMoney(5981, "de", "EUR")).toContain("€");
  });

  it("formats every supported currency in every supported language", () => {
    for (const language of languages) {
      for (const currency of currencies) {
        expect(formatMoney(5981, language.code, currency)).not.toBe("");
      }
    }
  });
});
