import { calculateBill, formatMoney, roundCents, type BillInputs, type BillResult } from "./calculate";
import { suggestCapitalBand, suggestDroughtTier } from "./suggestions";

/** Slider floor for the what-if water-use scenario (ccf). */
export const SAVINGS_USAGE_FLOOR = 0;

/** Brisbane residential bills are bimonthly → 6 bills per year. */
export const BILLS_PER_YEAR = 6;

export type LineSavings = {
  waterUse: number;
  waterService: number;
  sewer: number;
  capital: number;
  drought: number;
  total: number;
};

export type SavingsScenario = {
  baselineWaterUse: number;
  simulatedWaterUse: number;
  baselineWinter: number;
  simulatedWinter: number;
  baseline: BillResult;
  simulated: BillResult;
  savings: LineSavings;
};

/**
 * Scale winter sewer avg with simulated water use, preserving the baseline
 * water↔winter relationship (same ×1.15-linked pair when defaults apply).
 * Rounded to nearest 0.5 ccf.
 */
export function scaleWinterWithUsage(
  baselineWater: number,
  baselineWinter: number,
  simulatedWater: number,
): number {
  const water = Number.isFinite(simulatedWater) ? Math.max(0, simulatedWater) : 0;
  const baseW = Number.isFinite(baselineWater) ? Math.max(0, baselineWater) : 0;
  const baseWinter = Number.isFinite(baselineWinter)
    ? Math.max(0, baselineWinter)
    : 0;
  if (baseW <= 0) return 0;
  const scaled = baseWinter * (water / baseW);
  return Math.round(scaled * 2) / 2;
}

/** Clamp simulated water use to [floor, baseline]. */
export function clampSimulatedUsage(
  simulatedWater: number,
  baselineWater: number,
  floor = SAVINGS_USAGE_FLOOR,
): number {
  const base = Number.isFinite(baselineWater) ? Math.max(0, baselineWater) : 0;
  const sim = Number.isFinite(simulatedWater) ? simulatedWater : base;
  const lo = Math.min(floor, base);
  return Math.min(base, Math.max(lo, sim));
}

/** Default slider target: ~half of baseline usage, nearest 0.5 ccf. */
export function defaultSimulatedUsage(baselineWater: number): number {
  const base = Number.isFinite(baselineWater) ? Math.max(0, baselineWater) : 0;
  return clampSimulatedUsage(Math.round(base) / 2, base);
}

/**
 * What-if bill vs current inputs. Water use + winter scale together; capital
 * and drought are re-suggested from simulated usage (same band/tier helpers
 * as Bill inputs).
 */
export function buildSavingsScenario(
  baselineInputs: BillInputs,
  simulatedWaterUse: number,
): SavingsScenario {
  const baselineWaterUse = Math.max(0, baselineInputs.waterUseCcf);
  const baselineWinter = Math.max(0, baselineInputs.winterSewerAvgCcf);
  const simulated = clampSimulatedUsage(simulatedWaterUse, baselineWaterUse);
  const simulatedWinter = scaleWinterWithUsage(
    baselineWaterUse,
    baselineWinter,
    simulated,
  );

  const capitalAmount = suggestCapitalBand(simulated).amount;
  const droughtAmount = suggestDroughtTier(simulated).amount;

  const baseline = calculateBill(baselineInputs);
  const simulatedResult = calculateBill({
    ...baselineInputs,
    waterUseCcf: simulated,
    winterSewerAvgCcf: simulatedWinter,
    capitalAmount,
    droughtAmount,
  });

  const savings: LineSavings = {
    waterUse: roundCents(baseline.waterUse - simulatedResult.waterUse),
    waterService: roundCents(
      baseline.waterService - simulatedResult.waterService,
    ),
    sewer: roundCents(baseline.sewer - simulatedResult.sewer),
    capital: roundCents(baseline.capital - simulatedResult.capital),
    drought: roundCents(baseline.drought - simulatedResult.drought),
    total: roundCents(baseline.total - simulatedResult.total),
  };

  return {
    baselineWaterUse,
    simulatedWaterUse: simulated,
    baselineWinter,
    simulatedWinter,
    baseline,
    simulated: simulatedResult,
    savings,
  };
}

const BREAKDOWN_LINES: Array<{
  key: keyof Omit<LineSavings, "total" | "waterService">;
  label: string;
}> = [
  { key: "waterUse", label: "Water Use" },
  { key: "sewer", label: "Sewer Charges" },
  { key: "capital", label: "Capital Project Charges" },
  { key: "drought", label: "Drought Contingency" },
];

/** Positive savings lines for the breakdown sentence (amount > 0 only). */
export function positiveSavingsLines(
  savings: LineSavings,
): Array<{ amount: number; label: string }> {
  return BREAKDOWN_LINES.filter(({ key }) => savings[key] > 0).map(
    ({ key, label }) => ({ amount: savings[key], label }),
  );
}

/**
 * Build the “That’s $… on Water Use and …” sentence. Only includes lines with
 * savings > $0 (omits zero capital/drought when bands don’t change).
 */
export function formatPositiveSavingsSentence(savings: LineSavings): string {
  const lines = positiveSavingsLines(savings);
  const parts = lines.map(
    ({ amount, label }) => `${formatMoney(amount)} savings on ${label}`,
  );
  if (parts.length === 0) {
    return "No line-item savings at this usage level.";
  }
  if (parts.length === 1) {
    return `That's ${parts[0]} per bill.`;
  }
  if (parts.length === 2) {
    return `That's ${parts[0]} and ${parts[1]} per bill.`;
  }
  const last = parts[parts.length - 1];
  const head = parts.slice(0, -1).join(", ");
  return `That's ${head}, and ${last} per bill.`;
}

export function formatCcf(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * Percent less water used vs baseline (0–100). Whole number for copy.
 * Baseline 0 → 0%. Simulated above baseline clamps at 0%.
 */
export function waterReductionPercent(
  baselineWater: number,
  simulatedWater: number,
): number {
  const base = Number.isFinite(baselineWater) ? Math.max(0, baselineWater) : 0;
  const sim = Number.isFinite(simulatedWater) ? Math.max(0, simulatedWater) : 0;
  if (base <= 0) return 0;
  const pct = ((base - Math.min(sim, base)) / base) * 100;
  return Math.round(pct);
}

/** Annualize a per-bill savings amount (bimonthly × 6). */
export function annualizeSavings(
  perBill: number,
  billsPerYear = BILLS_PER_YEAR,
): number {
  return roundCents(perBill * billsPerYear);
}

/** Format a whole-number percent for UI copy (no “%” suffix). */
export function formatPercentWhole(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return String(Math.round(n));
}
