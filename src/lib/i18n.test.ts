import { describe, expect, it } from "vitest";
import { languages } from "./defaults";
import { copies } from "./i18n";

describe("i18n dictionaries", () => {
  it("contains the same keys for every supported language", () => {
    const referenceKeys = Object.keys(copies["zh-CN"]).sort();

    for (const language of languages) {
      expect(Object.keys(copies[language.code]).sort()).toEqual(referenceKeys);
    }
  });

  it("includes all required languages", () => {
    expect(languages.map((language) => language.code)).toEqual([
      "zh-CN",
      "en",
      "de",
      "fr",
      "it",
    ]);
  });

  it("uses a neutral Chinese result title", () => {
    expect(copies["zh-CN"].resultTitle).toBe("预计回本时间");
  });
});
