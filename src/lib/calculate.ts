import {
  SEWER_RATES,
  WATER_CONSUMPTION,
  WATER_FIXED,
  type MeterSize,
  type RateYear,
} from "./rates";

export type BillInputs = {
  rateYear: RateYear;
  meterSize: MeterSize;
  /** Bimonthly water usage in ccf (hundreds of cubic feet). */
  waterUseCcf: number;
  /** Winter average water use for sewer (mid-Oct → mid-Feb), may be half-units. */
  winterSewerAvgCcf: number;
  /** Capital project charge (auto-suggested from usage band, or user override). */
  capitalAmount: number;
  /** Drought contingency (auto-suggested from usage vs median, or user override). */
  droughtAmount: number;
};

export type BillLine = {
  id:
    | "waterUse"
    | "waterService"
    | "sewer"
    | "capital"
    | "drought"
    | "total";
  label: string;
  amount: number;
  formula: string;
};

export type BillResult = {
  lines: BillLine[];
  waterService: number;
  waterUse: number;
  sewer: number;
  capital: number;
  drought: number;
  total: number;
  details: {
    tier1Units: number;
    tier2Units: number;
    tier1Rate: number;
    tier2Rate: number;
    sewerFixed: number;
    sewerVariable: number;
  };
};

/** Round to nearest cent (banker's-ish: standard half-up via Math.round). */
export function roundCents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Residential water bill split:
 * - WATER SERVICE = fixed charge for meter (includes first 1 ccf)
 * - WATER USE = tier1 × units 2–20 + tier2 × units over 20
 *
 * Uses Prop 218 / published maxima for tier 2 (over-20).
 */
export function calculateBill(inputs: BillInputs): BillResult {
  const { rateYear, meterSize, waterUseCcf, winterSewerAvgCcf } = inputs;

  const fixed = WATER_FIXED[rateYear][meterSize];
  const { tier1, tier2 } = WATER_CONSUMPTION[rateYear];
  const sewer = SEWER_RATES[rateYear];

  const usage = Math.max(0, waterUseCcf);
  // First ccf included in fixed; tier1 covers units 2 through 20 (up to 19 billable units).
  const tier1Units = Math.min(Math.max(usage - 1, 0), 19);
  const tier2Units = Math.max(usage - 20, 0);

  const waterService = roundCents(fixed);
  const waterUse = roundCents(tier1Units * tier1 + tier2Units * tier2);
  const sewerAmount = roundCents(
    sewer.fixed + sewer.variable * Math.max(0, winterSewerAvgCcf),
  );
  const capital = roundCents(Math.max(0, inputs.capitalAmount));
  const drought = roundCents(Math.max(0, inputs.droughtAmount));
  const total = roundCents(
    waterService + waterUse + sewerAmount + capital + drought,
  );

  const waterUseFormula =
    tier2Units > 0
      ? `${tier1Units} ccf × $${tier1.toFixed(2)} (units 2–20) + ${tier2Units} ccf × $${tier2.toFixed(2)} (over 20) = ${formatMoney(waterUse)}`
      : usage <= 1
        ? `First 1 ccf included in water service; no additional use charge`
        : `${tier1Units} ccf × $${tier1.toFixed(2)} (units 2–20) = ${formatMoney(waterUse)}`;

  const lines: BillLine[] = [
    {
      id: "waterUse",
      label: "WATER USE",
      amount: waterUse,
      formula: waterUseFormula,
    },
    {
      id: "waterService",
      label: "WATER SERVICE",
      amount: waterService,
      formula: `Fixed bimonthly charge for ${meterSize} meter (${rateYear} schedule) = ${formatMoney(waterService)}`,
    },
    {
      id: "sewer",
      label: "SEWER",
      amount: sewerAmount,
      formula: `$${sewer.fixed.toFixed(2)} fixed + $${sewer.variable.toFixed(2)}/ccf × ${winterSewerAvgCcf} ccf winter avg = ${formatMoney(sewerAmount)}`,
    },
    {
      id: "capital",
      label: "CAPITAL PROJECT CHRG",
      amount: capital,
      formula: `Capital charge = ${formatMoney(capital)} (auto from usage band proxy, or user override; City bands are spring usage mid-Feb–mid-Jun)`,
    },
    {
      id: "drought",
      label: "DROUGHT CONTINGENCY",
      amount: drought,
      formula: `Drought charge = ${formatMoney(drought)} (auto below/above median 12 from usage proxy, or user override)`,
    },
    {
      id: "total",
      label: "CURRENT BILL / AMOUNT DUE",
      amount: total,
      formula: `${formatMoney(waterUse)} + ${formatMoney(waterService)} + ${formatMoney(sewerAmount)} + ${formatMoney(capital)} + ${formatMoney(drought)} = ${formatMoney(total)}`,
    },
  ];

  return {
    lines,
    waterService,
    waterUse,
    sewer: sewerAmount,
    capital,
    drought,
    total,
    details: {
      tier1Units,
      tier2Units,
      tier1Rate: tier1,
      tier2Rate: tier2,
      sewerFixed: sewer.fixed,
      sewerVariable: sewer.variable,
    },
  };
}

/** Compare the same inputs under every approved rate year through 2027. */
export function projectAcrossYears(
  inputs: Omit<BillInputs, "rateYear">,
): Array<{ rateYear: RateYear; result: BillResult }> {
  const years: RateYear[] = [2023, 2024, 2025, 2026, 2027];
  return years.map((rateYear) => ({
    rateYear,
    result: calculateBill({ ...inputs, rateYear }),
  }));
}
