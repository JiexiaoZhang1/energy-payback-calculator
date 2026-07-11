import { describe, expect, it } from "vitest";
import {
  coverTariffRange,
  deleteTariffBlock,
  normalizeTariffBlocksForEditing,
  updateTariffBlockRange,
} from "./tariffEditor";
import type { TariffBlock } from "./types";

const baseBlocks: TariffBlock[] = [
  { id: "night", startHour: 0, endHour: 6, pricePerKwh: -0.2 },
  { id: "day", startHour: 6, endHour: 17, pricePerKwh: 0.35 },
  { id: "peak", startHour: 17, endHour: 24, pricePerKwh: 1.2 },
];

function coverage(blocks: TariffBlock[]): number[] {
  const hours: number[] = [];
  for (const block of blocks) {
    for (let hour = block.startHour; hour < block.endHour; hour += 1) {
      hours.push(hour);
    }
  }
  return hours;
}

describe("tariff editor helpers", () => {
  it("covers a new range by splitting old periods and merging adjacent equal prices", () => {
    const next = coverTariffRange(baseBlocks, 12, 14, -0.5);

    expect(next).toEqual([
      expect.objectContaining({ startHour: 0, endHour: 6, pricePerKwh: -0.2 }),
      expect.objectContaining({ startHour: 6, endHour: 12, pricePerKwh: 0.35 }),
      expect.objectContaining({ startHour: 12, endHour: 14, pricePerKwh: -0.5 }),
      expect.objectContaining({ startHour: 14, endHour: 17, pricePerKwh: 0.35 }),
      expect.objectContaining({ startHour: 17, endHour: 24, pricePerKwh: 1.2 }),
    ]);
    expect(coverage(next)).toEqual(Array.from({ length: 24 }, (_, hour) => hour));
  });

  it("updates an existing block range without leaving gaps", () => {
    const normalized = normalizeTariffBlocksForEditing(baseBlocks);
    const day = normalized.find((block) => block.startHour === 6);
    expect(day).toBeDefined();

    const next = updateTariffBlockRange(normalized, day!.id, 5, 16, 0.42);

    expect(next).toContainEqual(
      expect.objectContaining({ startHour: 5, endHour: 16, pricePerKwh: 0.42 }),
    );
    expect(next[0]).toEqual(
      expect.objectContaining({ startHour: 0, endHour: 5, pricePerKwh: -0.2 }),
    );
    expect(coverage(next)).toEqual(Array.from({ length: 24 }, (_, hour) => hour));
  });

  it("deletes first, middle, and last blocks by merging into a neighbor", () => {
    const normalized = normalizeTariffBlocksForEditing(baseBlocks);
    const withoutFirst = deleteTariffBlock(normalized, normalized[0].id);
    const withoutMiddle = deleteTariffBlock(normalized, normalized[1].id);
    const withoutLast = deleteTariffBlock(normalized, normalized[2].id);

    expect(withoutFirst[0]).toEqual(
      expect.objectContaining({ startHour: 0, endHour: 17, pricePerKwh: 0.35 }),
    );
    expect(withoutMiddle[0]).toEqual(
      expect.objectContaining({ startHour: 0, endHour: 17, pricePerKwh: -0.2 }),
    );
    expect(withoutLast.at(-1)).toEqual(
      expect.objectContaining({ startHour: 6, endHour: 24, pricePerKwh: 0.35 }),
    );
    expect(coverage(withoutFirst)).toHaveLength(24);
    expect(coverage(withoutMiddle)).toHaveLength(24);
    expect(coverage(withoutLast)).toHaveLength(24);
  });

  it("normalizes unordered, overlapping, and missing periods into a full day", () => {
    const next = normalizeTariffBlocksForEditing([
      { id: "late", startHour: 18, endHour: 24, pricePerKwh: 1 },
      { id: "overlap", startHour: 17, endHour: 20, pricePerKwh: 2 },
      { id: "early", startHour: 0, endHour: 2, pricePerKwh: -0.1 },
    ]);

    expect(next[0]).toEqual(
      expect.objectContaining({ startHour: 0, endHour: 2, pricePerKwh: -0.1 }),
    );
    expect(next.at(-1)).toEqual(
      expect.objectContaining({ startHour: 20, endHour: 24, pricePerKwh: 1 }),
    );
    expect(coverage(next)).toEqual(Array.from({ length: 24 }, (_, hour) => hour));
  });
});
