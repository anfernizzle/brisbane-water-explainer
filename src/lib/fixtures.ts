import type { BillInputs } from "./calculate";
import type { MeterSize, RateYear } from "./rates";

/**
 * Ground-truth fixtures from account 002-1220-002 bill PDFs.
 * See Project store docs/bill-fixtures.md.
 *
 * Shared: meter 5/8" (or 3/4" — same rates), winter sewer avg 18.5,
 * capital $76, drought $6.99.
 */
export type BillFixture = {
  id: string;
  label: string;
  billDate: string;
  servicePeriod: string;
  inputs: BillInputs;
  expected: {
    waterUse: number;
    waterService: number;
    sewer: number;
    capital: number;
    drought: number;
    total: number;
  };
  /**
   * When true, water use / total should NOT be asserted against the billed
   * amounts — the Jun 2026 fixture used a 2024 over-20 rate ($13.47) while
   * we use Prop 218 2025 maxima ($14.34).
   */
  skipExactOver20Match?: boolean;
  /** Expected Prop-218 water use when skipExactOver20Match is set. */
  publishedWaterUse?: number;
  publishedTotal?: number;
};

const SHARED = {
  meterSize: '5/8"' as MeterSize,
  winterSewerAvgCcf: 18.5,
  capitalAmount: 76,
  droughtAmount: 6.99,
};

export const BILL_FIXTURES: BillFixture[] = [
  {
    id: "251029",
    label: "Oct 2025 — 19 ccf (2025 rates)",
    billDate: "10/29/2025",
    servicePeriod: "8/15/2025 → 10/15/2025",
    inputs: {
      ...SHARED,
      rateYear: 2025 as RateYear,
      waterUseCcf: 19,
    },
    expected: {
      waterUse: 130.68,
      waterService: 39.23,
      sewer: 329.28,
      capital: 76,
      drought: 6.99,
      total: 582.18,
    },
  },
  {
    id: "251229",
    label: "Dec 2025 — 17 ccf (2025 rates)",
    billDate: "12/29/2025",
    servicePeriod: "10/15/2025 → 12/15/2025",
    inputs: {
      ...SHARED,
      rateYear: 2025,
      waterUseCcf: 17,
    },
    expected: {
      waterUse: 116.16,
      waterService: 39.23,
      sewer: 329.28,
      capital: 76,
      drought: 6.99,
      total: 567.66,
    },
  },
  {
    id: "260226",
    label: "Feb 2026 — 20 ccf (2025 rates)",
    billDate: "2/26/2026",
    servicePeriod: "12/15/2025 → 2/15/2026",
    inputs: {
      ...SHARED,
      rateYear: 2025,
      waterUseCcf: 20,
    },
    expected: {
      waterUse: 137.94,
      waterService: 39.23,
      sewer: 329.28,
      capital: 76,
      drought: 6.99,
      total: 589.44,
    },
  },
  {
    id: "260428",
    label: "Apr 2026 — 16 ccf (2025 rates)",
    billDate: "4/28/2026",
    servicePeriod: "2/15/2026 → 4/15/2026",
    inputs: {
      ...SHARED,
      rateYear: 2025,
      waterUseCcf: 16,
    },
    expected: {
      waterUse: 108.9,
      waterService: 39.23,
      sewer: 329.28,
      capital: 76,
      drought: 6.99,
      total: 560.4,
    },
  },
  {
    id: "260625",
    label: "Jun 2026 — 21 ccf (2025 rates, over-20)",
    billDate: "6/25/2026",
    servicePeriod: "4/15/2026 → 6/15/2026",
    inputs: {
      ...SHARED,
      rateYear: 2025,
      waterUseCcf: 21,
    },
    expected: {
      // Billed amounts used 2024 over-20 ($13.47); we do not match these.
      waterUse: 151.41,
      waterService: 39.23,
      sewer: 329.28,
      capital: 76,
      drought: 6.99,
      total: 602.91,
    },
    skipExactOver20Match: true,
    // Prop 218 2025: 19 × 7.26 + 1 × 14.34 = 137.94 + 14.34 = 152.28
    publishedWaterUse: 152.28,
    // 152.28 + 39.23 + 329.28 + 76 + 6.99 = 603.78
    publishedTotal: 603.78,
  },
  {
    id: "260827",
    label: "Aug 2026 — 16 ccf (2026 rates)",
    billDate: "8/27/2026",
    servicePeriod: "6/15/2026 → 8/15/2026",
    inputs: {
      ...SHARED,
      rateYear: 2026,
      waterUseCcf: 16,
    },
    expected: {
      waterUse: 116.85,
      waterService: 42.55,
      sewer: 405.3,
      capital: 76,
      drought: 6.99,
      total: 647.69,
    },
  },
];
