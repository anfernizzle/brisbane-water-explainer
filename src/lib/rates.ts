/**
 * Brisbane, CA residential water/sewer rates (approved maxima).
 * Source of truth: Prop 218 notice (Res. 2023-17 schedule through 6/15/2027).
 * See docs/rate-sources.md in the Project store.
 */

export type RateYear = 2023 | 2024 | 2025 | 2026 | 2027;

export type MeterSize =
  | '5/8"'
  | '3/4"'
  | '1"'
  | '1.5"'
  | '2"'
  | '3"'
  | '4"'
  | '6"';

export const RATE_YEARS: RateYear[] = [2023, 2024, 2025, 2026, 2027];

export const METER_SIZES: MeterSize[] = [
  '5/8"',
  '3/4"',
  '1"',
  '1.5"',
  '2"',
  '3"',
  '4"',
  '6"',
];

/** Effective date for each rate-year column (rates appear on the August bill). */
export const RATE_YEAR_EFFECTIVE: Record<RateYear, string> = {
  2023: "6/15/2023",
  2024: "6/15/2024",
  2025: "6/15/2025",
  2026: "6/15/2026",
  2027: "6/15/2027",
};

/** Bimonthly fixed water service charge by meter size ($). */
export const WATER_FIXED: Record<RateYear, Record<MeterSize, number>> = {
  2023: {
    '5/8"': 33.35,
    '3/4"': 33.35,
    '1"': 41.9,
    '1.5"': 63.29,
    '2"': 88.95,
    '3"': 157.37,
    '4"': 234.35,
    '6"': 448.19,
  },
  2024: {
    '5/8"': 36.17,
    '3/4"': 36.17,
    '1"': 45.45,
    '1.5"': 68.65,
    '2"': 96.49,
    '3"': 170.73,
    '4"': 254.25,
    '6"': 486.25,
  },
  2025: {
    '5/8"': 39.23,
    '3/4"': 39.23,
    '1"': 49.29,
    '1.5"': 74.44,
    '2"': 104.62,
    '3"': 185.1,
    '4"': 275.64,
    '6"': 527.14,
  },
  2026: {
    '5/8"': 42.55,
    '3/4"': 42.55,
    '1"': 53.46,
    '1.5"': 80.75,
    '2"': 113.49,
    '3"': 200.79,
    '4"': 299.01,
    '6"': 571.85,
  },
  2027: {
    '5/8"': 46.28,
    '3/4"': 46.28,
    '1"': 58.12,
    '1.5"': 87.72,
    '2"': 123.24,
    '3"': 217.96,
    '4"': 324.52,
    '6"': 620.52,
  },
};

/** Per-ccf consumption rates. Tier 1 = units 2–20; Tier 2 = over 20. First ccf is in fixed. */
export const WATER_CONSUMPTION: Record<
  RateYear,
  { tier1: number; tier2: number }
> = {
  2023: { tier1: 6.3, tier2: 12.65 },
  2024: { tier1: 6.76, tier2: 13.47 },
  2025: { tier1: 7.26, tier2: 14.34 },
  2026: { tier1: 7.79, tier2: 15.27 },
  2027: { tier1: 8.36, tier2: 16.25 },
};

export const SEWER_RATES: Record<
  RateYear,
  { fixed: number; variable: number }
> = {
  2023: { fixed: 64.2, variable: 8.29 },
  2024: { fixed: 79.86, variable: 10.15 },
  2025: { fixed: 99.32, variable: 12.43 },
  2026: { fixed: 123.54, variable: 15.23 },
  2027: { fixed: 153.66, variable: 18.67 },
};

/**
 * Capital Projects Charge presets — Current Rate (Adopted 2022) from
 * https://www.brisbaneca.gov/513/Capital-Projects-Charge
 * (graduated by springtime usage mid-Feb–mid-Jun; per 2-month cycle).
 * Calculator auto-suggests from entered water-use as a proxy when spring
 * average is unknown; user can override.
 */
export const CAPITAL_PRESETS = [
  { id: "0", label: "0 units — $20", amount: 20 },
  { id: "1", label: "1 unit — $25", amount: 25 },
  { id: "2", label: "2 units — $30", amount: 30 },
  { id: "3", label: "3 units — $35", amount: 35 },
  { id: "4", label: "4 units — $40", amount: 40 },
  { id: "5", label: "5 units — $45", amount: 45 },
  { id: "6", label: "6 units — $50", amount: 50 },
  { id: "7", label: "7 units — $55", amount: 55 },
  { id: "8", label: "8 units — $60", amount: 60 },
  { id: "9", label: "9 units — $65", amount: 65 },
  { id: "10", label: "10 units — $70", amount: 70 },
  { id: "11-19", label: "11 to 19 units — $76", amount: 76 },
  { id: "20-40", label: "20 to 40 units — $100", amount: 100 },
  { id: ">40", label: "Greater than 40 units — $130", amount: 130 },
] as const;

/**
 * Drought Contingency Charge presets from
 * https://www.brisbaneca.gov/512/Drought-Contingency-Charge
 * (per billing / 2-month cycle). Landscape $102.14 omitted (residential only).
 * Calculator auto-suggests below/above median (12) from the water-use proxy;
 * user can override.
 */
export const DROUGHT_PRESETS = [
  {
    id: "below",
    label: "Below median (currently 12 units) — $2.32",
    amount: 2.32,
  },
  {
    id: "above",
    label: "Above median (currently 12 units) — $6.99",
    amount: 6.99,
  },
] as const;

/** Official City + Prop 218 citations shown in the disclaimer (bill line order, then rest). */
export const SOURCE_LINKS = [
  {
    label: "Residential water rate table",
    href: "https://www.brisbaneca.gov/514/Water-Rate-Table---Residential",
  },
  {
    label: "Sewer rate table",
    href: "https://www.brisbaneca.gov/517/Sewer-Rate-Table---Residential-Commercia",
  },
  {
    label: "Capital Projects Charge (official)",
    href: "https://www.brisbaneca.gov/513/Capital-Projects-Charge",
  },
  {
    label: "Drought Contingency Charge (official)",
    href: "https://www.brisbaneca.gov/512/Drought-Contingency-Charge",
  },
  {
    label: "Prop 218 notice (2023–2027 maxima)",
    href: "https://www.brisbaneca.gov/DocumentCenter/View/1573",
  },
  {
    label: "Rate Tables hub",
    href: "https://www.brisbaneca.gov/507/Rate-Tables-Charges",
  },
] as const;

/** Default inputs for a new calculator session (not bill-fixture ground truth). */
export const DEFAULT_INPUTS = {
  rateYear: 2025 as RateYear,
  meterSize: '5/8"' as MeterSize,
  waterUseCcf: 19,
  /** Prefill = water use × 1.15 → nearest 0.5 (19 → 22). Fixtures still set 18.5 explicitly. */
  winterSewerAvgCcf: 22,
  capitalAmount: 76,
  droughtAmount: 6.99,
};
