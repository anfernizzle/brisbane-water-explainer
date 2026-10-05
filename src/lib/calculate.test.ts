import { describe, expect, it } from "vitest";
import { calculateBill, roundCents } from "./calculate";
import { BILL_FIXTURES } from "./fixtures";
import { WATER_CONSUMPTION } from "./rates";

describe("Brisbane residential bill calculator", () => {
  for (const fixture of BILL_FIXTURES) {
    describe(fixture.label, () => {
      const result = calculateBill(fixture.inputs);

      it("matches WATER SERVICE", () => {
        expect(result.waterService).toBe(fixture.expected.waterService);
      });

      it("matches SEWER", () => {
        expect(result.sewer).toBe(fixture.expected.sewer);
      });

      it("matches CAPITAL PROJECT CHRG", () => {
        expect(result.capital).toBe(fixture.expected.capital);
      });

      it("matches DROUGHT CONTINGENCY", () => {
        expect(result.drought).toBe(fixture.expected.drought);
      });

      if (fixture.skipExactOver20Match) {
        it("uses Prop 218 over-20 (not the Jun 2026 billed $13.47 blip)", () => {
          expect(result.details.tier2Rate).toBe(
            WATER_CONSUMPTION[2025].tier2,
          );
          expect(result.details.tier2Rate).toBe(14.34);
          expect(result.waterUse).toBe(fixture.publishedWaterUse);
          expect(result.total).toBe(fixture.publishedTotal);
          // Document divergence from billed amounts
          expect(result.waterUse).not.toBe(fixture.expected.waterUse);
          expect(result.total).not.toBe(fixture.expected.total);
        });
      } else {
        it("matches WATER USE to the penny", () => {
          expect(result.waterUse).toBe(fixture.expected.waterUse);
        });

        it("matches TOTAL to the penny", () => {
          expect(result.total).toBe(fixture.expected.total);
        });
      }
    });
  }

  it("rounds sewer half-unit math like the fixtures (18.5 × 12.43)", () => {
    // 99.32 + 12.43 × 18.5 = 329.275 → 329.28
    expect(roundCents(99.32 + 12.43 * 18.5)).toBe(329.28);
    expect(roundCents(123.54 + 15.23 * 18.5)).toBe(405.3);
  });

  it("charges nothing for water use at 0–1 ccf", () => {
    const zero = calculateBill({
      rateYear: 2025,
      meterSize: '5/8"',
      waterUseCcf: 0,
      winterSewerAvgCcf: 0,
      capitalAmount: 0,
      droughtAmount: 0,
    });
    expect(zero.waterUse).toBe(0);
    expect(zero.waterService).toBe(39.23);

    const one = calculateBill({
      rateYear: 2025,
      meterSize: '5/8"',
      waterUseCcf: 1,
      winterSewerAvgCcf: 0,
      capitalAmount: 0,
      droughtAmount: 0,
    });
    expect(one.waterUse).toBe(0);
  });
});
