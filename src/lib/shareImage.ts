import { assetKeys, getCopy } from "./i18n";
import { formatMoney, formatNumber } from "./format";
import type { CalculatorState, CalculationResult, Language } from "./types";

export async function downloadShareImage(
  state: CalculatorState,
  result: CalculationResult,
): Promise<void> {
  const copy = getCopy(state.language);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1500;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 60px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(copy.shareTitle, 72, 120);

  ctx.fillStyle = "#f0fdf4";
  roundRect(ctx, 72, 170, 936, 390, 48);
  ctx.fill();
  ctx.strokeStyle = "#bbf7d0";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#047857";
  ctx.font = "800 116px system-ui, -apple-system, Segoe UI, sans-serif";
  const payback =
    result.paybackYears === null
      ? copy.noPayback
      : `${formatNumber(result.paybackYears, state.language, 1)} ${copy.years}`;
  drawCenteredText(ctx, payback, 540, 330);
  ctx.fillStyle = "#166534";
  ctx.font = "700 44px system-ui, -apple-system, Segoe UI, sans-serif";
  drawCenteredText(
    ctx,
    `${copy.annualSavings} ${formatMoney(result.annualSavings, state.language, state.currency)}`,
    540,
    420,
  );

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 42px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(copy.savingsFrom, 72, 655);

  const colors = ["#2f80ed", "#f97316", "#16a34a", "#8b5cf6"];
  assetKeys.forEach((key, index) => {
    const x = 72 + (index % 2) * 480;
    const y = 710 + Math.floor(index / 2) * 210;
    ctx.fillStyle = "#f8fafc";
    roundRect(ctx, x, y, 432, 158, 32);
    ctx.fill();
    ctx.fillStyle = colors[index];
    roundRect(ctx, x + 28, y + 32, 72, 72, 24);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 40px system-ui, -apple-system, Segoe UI, sans-serif";
    drawCenteredText(ctx, iconFor(index), x + 64, y + 82);
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 30px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(copy[key], x + 124, y + 62);
    ctx.fillStyle = colors[index];
    ctx.font = "800 34px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(
      formatMoney(result.contributions[key].annualSavings, state.language, state.currency),
      x + 124,
      y + 112,
    );
  });

  ctx.fillStyle = "#64748b";
  ctx.font = "400 30px system-ui, -apple-system, Segoe UI, sans-serif";
  wrapText(ctx, copy.shareNote, 72, 1220, 936, 42);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png", 0.95);
  });
  if (!blob) throw new Error("Could not create image");

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName(state.language);
  anchor.click();
  URL.revokeObjectURL(url);
}

function fileName(language: Language): string {
  return language === "zh-CN" ? "我的省钱估算.png" : "energy-savings-estimate.png";
}

function iconFor(index: number): string {
  return ["⚡", "♨", "EV", "⏱"][index] ?? "•";
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
): void {
  const width = ctx.measureText(text).width;
  ctx.fillText(text, x - width / 2, y);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(" ");
  let line = "";
  let lineY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, lineY);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
