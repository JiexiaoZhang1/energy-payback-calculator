import { expandTariffBlocks, normalizeHour } from "./calculations";
import type { TariffBlock } from "./types";

const hoursPerDay = 24;
const fallbackPrice = 0.3;
const priceTolerance = 0.000001;

function samePrice(a: number, b: number): boolean {
  return Math.abs(a - b) < priceTolerance;
}

function safePrice(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clampStart(hour: number): number {
  return Math.max(0, Math.min(23, normalizeHour(hour)));
}

function clampEnd(hour: number, startHour: number): number {
  return Math.max(startHour + 1, Math.min(24, normalizeHour(hour)));
}

export function blocksToHourlyPrices(blocks: TariffBlock[]): number[] {
  return expandTariffBlocks(blocks, fallbackPrice);
}

export function hourlyPricesToBlocks(
  prices: number[],
  idPrefix = "tariff",
): TariffBlock[] {
  const normalizedPrices = Array.from({ length: hoursPerDay }, (_, hour) =>
    safePrice(prices[hour] ?? fallbackPrice),
  );
  const blocks: TariffBlock[] = [];
  let startHour = 0;
  let currentPrice = normalizedPrices[0] ?? fallbackPrice;

  for (let hour = 1; hour <= hoursPerDay; hour += 1) {
    const nextPrice = normalizedPrices[hour];
    if (hour === hoursPerDay || !samePrice(currentPrice, nextPrice)) {
      blocks.push({
        id: `${idPrefix}-${startHour}-${hour}-${blocks.length}`,
        startHour,
        endHour: hour,
        pricePerKwh: currentPrice,
      });
      startHour = hour;
      currentPrice = nextPrice ?? fallbackPrice;
    }
  }

  return blocks;
}

export function normalizeTariffBlocksForEditing(blocks: TariffBlock[]): TariffBlock[] {
  return hourlyPricesToBlocks(blocksToHourlyPrices(blocks), "tariff");
}

export function coverTariffRange(
  blocks: TariffBlock[],
  startHourInput: number,
  endHourInput: number,
  pricePerKwh: number,
): TariffBlock[] {
  const startHour = clampStart(startHourInput);
  const endHour = clampEnd(endHourInput, startHour);
  const prices = blocksToHourlyPrices(blocks);

  for (let hour = startHour; hour < endHour; hour += 1) {
    prices[hour] = safePrice(pricePerKwh);
  }

  return hourlyPricesToBlocks(prices, "tariff");
}

export function updateTariffBlockRange(
  blocks: TariffBlock[],
  blockId: string,
  startHourInput: number,
  endHourInput: number,
  pricePerKwh: number,
): TariffBlock[] {
  const normalizedBlocks = normalizeTariffBlocksForEditing(blocks);
  const targetIndex = normalizedBlocks.findIndex((block) => block.id === blockId);
  if (targetIndex === -1) {
    return coverTariffRange(blocks, startHourInput, endHourInput, pricePerKwh);
  }

  const target = normalizedBlocks[targetIndex];
  const previous = normalizedBlocks[targetIndex - 1];
  const next = normalizedBlocks[targetIndex + 1];
  const startHour = clampStart(startHourInput);
  const endHour = clampEnd(endHourInput, startHour);
  const prices = blocksToHourlyPrices(normalizedBlocks);

  for (let hour = target.startHour; hour < target.endHour; hour += 1) {
    if (hour < startHour) {
      prices[hour] = previous?.pricePerKwh ?? next?.pricePerKwh ?? safePrice(pricePerKwh);
    } else if (hour >= endHour) {
      prices[hour] = next?.pricePerKwh ?? previous?.pricePerKwh ?? safePrice(pricePerKwh);
    }
  }

  for (let hour = startHour; hour < endHour; hour += 1) {
    prices[hour] = safePrice(pricePerKwh);
  }

  return hourlyPricesToBlocks(prices, "tariff");
}

export function deleteTariffBlock(blocks: TariffBlock[], blockId: string): TariffBlock[] {
  const normalizedBlocks = normalizeTariffBlocksForEditing(blocks);
  if (normalizedBlocks.length <= 1) return normalizedBlocks;

  const targetIndex = normalizedBlocks.findIndex((block) => block.id === blockId);
  if (targetIndex === -1) return normalizedBlocks;

  const target = normalizedBlocks[targetIndex];
  const replacement =
    normalizedBlocks[targetIndex - 1]?.pricePerKwh ??
    normalizedBlocks[targetIndex + 1]?.pricePerKwh ??
    fallbackPrice;
  const prices = blocksToHourlyPrices(normalizedBlocks);

  for (let hour = target.startHour; hour < target.endHour; hour += 1) {
    prices[hour] = replacement;
  }

  return hourlyPricesToBlocks(prices, "tariff");
}

export function getSuggestedTariffRange(
  blocks: TariffBlock[],
  activeBlockId?: string,
): Pick<TariffBlock, "startHour" | "endHour" | "pricePerKwh"> {
  const normalizedBlocks = normalizeTariffBlocksForEditing(blocks);
  const activeBlock = normalizedBlocks.find((block) => block.id === activeBlockId);
  const sourceBlock =
    activeBlock ??
    normalizedBlocks.reduce((largest, block) =>
      block.endHour - block.startHour > largest.endHour - largest.startHour ? block : largest,
    );
  const sourceLength = sourceBlock.endHour - sourceBlock.startHour;
  const length = Math.max(1, Math.min(2, sourceLength));
  const midpoint = sourceBlock.startHour + Math.floor(sourceLength / 2);
  const startHour = Math.max(
    sourceBlock.startHour,
    Math.min(sourceBlock.endHour - length, midpoint - Math.floor(length / 2)),
  );

  return {
    startHour,
    endHour: startHour + length,
    pricePerKwh: 0,
  };
}

export function isTariffFullySplit(blocks: TariffBlock[]): boolean {
  return normalizeTariffBlocksForEditing(blocks).length >= hoursPerDay;
}
