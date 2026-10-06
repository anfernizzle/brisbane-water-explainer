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
 * Inverse default: winter ÷ 1.15, rounded to nearest 0.5 ccf
 * (same half-unit granularity as winter; bill water use is often whole but 0.5 is consistent).
 */
export function estimateWaterUseFromWinter(winterSewerAvgCcf: number): number {
  const winter = Number.isFinite(winterSewerAvgCcf)
    ? Math.max(0, winterSewerAvgCcf)
    : 0;
  return Math.round((winter / 1.15) * 2) / 2;
}

/** Empty or zeroed field — not a manual value; the other field may drive it. */
export function isUnsetUsageField(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  const n = Number(trimmed);
  return Number.isFinite(n) && n === 0;
}

export type LinkedUsageWinter = {
  waterUse: string;
  winterAvg: string;
  waterManual: boolean;
  winterManual: boolean;
};

export function applyWaterUseChange(
  state: LinkedUsageWinter,
  nextWater: string,
): LinkedUsageWinter {
  if (isUnsetUsageField(nextWater)) {
    return { ...state, waterUse: nextWater, waterManual: false };
  }

  const usage = Number(nextWater);
  const next: LinkedUsageWinter = {
    ...state,
    waterUse: nextWater,
    waterManual: true,
  };

  if (!state.winterManual || isUnsetUsageField(state.winterAvg)) {
    next.winterAvg = String(estimateWinterSewerAvg(usage));
    next.winterManual = false;
  }

  return next;
}

export function applyWinterChange(
  state: LinkedUsageWinter,
  nextWinter: string,
): LinkedUsageWinter {
  if (isUnsetUsageField(nextWinter)) {
    return { ...state, winterAvg: nextWinter, winterManual: false };
  }

  const winter = Number(nextWinter);
  const next: LinkedUsageWinter = {
    ...state,
    winterAvg: nextWinter,
    winterManual: true,
  };

  if (!state.waterManual || isUnsetUsageField(state.waterUse)) {
    next.waterUse = String(estimateWaterUseFromWinter(winter));
    next.waterManual = false;
  }

  return next;
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
