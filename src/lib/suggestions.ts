import { CAPITAL_PRESETS, DROUGHT_PRESETS } from "./rates";

export type CapitalPresetId = (typeof CAPITAL_PRESETS)[number]["id"];
export type DroughtPresetId = (typeof DROUGHT_PRESETS)[number]["id"];

export const DROUGHT_MEDIAN_CCF = 12;

/**
 * Default winter sewer avg estimate: water use × 1.15, rounded to nearest 0.5 ccf.
 * Users should verify against their bill — this drives the sewer charge directly.
 */
export function estimateWinterSewerAvg(waterUseCcf: number): number {
  const usage = Number.isFinite(waterUseCcf) ? Math.max(0, waterUseCcf) : 0;
  return Math.round(usage * 1.15 * 2) / 2;
}

/**
 * Map bimonthly usage (ccf) → Capital Projects Charge band (2022 table).
 * Proxy: uses entered water-use when spring average is unknown.
 * Units are treated as whole ccf for banding (floored); 0 stays 0.
 */
export function suggestCapitalBand(waterUseCcf: number): {
  id: CapitalPresetId;
  amount: number;
  label: string;
} {
  const units = Number.isFinite(waterUseCcf)
    ? Math.max(0, Math.floor(waterUseCcf))
    : 0;

  let id: CapitalPresetId;
  if (units <= 0) id = "0";
  else if (units <= 10) id = String(units) as CapitalPresetId;
  else if (units <= 19) id = "11-19";
  else if (units <= 40) id = "20-40";
  else id = ">40";

  const preset = CAPITAL_PRESETS.find((p) => p.id === id)!;
  return { id: preset.id, amount: preset.amount, label: preset.label };
}

/**
 * Map usage proxy → drought below/above median (currently 12 units).
 * Equality at the median is treated as "below" (not "above").
 */
export function suggestDroughtTier(waterUseCcf: number): {
  id: DroughtPresetId;
  amount: number;
  label: string;
} {
  const usage = Number.isFinite(waterUseCcf) ? Math.max(0, waterUseCcf) : 0;
  const id: DroughtPresetId = usage > DROUGHT_MEDIAN_CCF ? "above" : "below";
  const preset = DROUGHT_PRESETS.find((p) => p.id === id)!;
  return { id: preset.id, amount: preset.amount, label: preset.label };
}
