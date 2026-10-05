import { describe, expect, it } from "vitest";
import {
  suggestCapitalBand,
  suggestDroughtTier,
  DROUGHT_MEDIAN_CCF,
} from "./suggestions";

describe("capital / drought auto suggestions from usage proxy", () => {
  it("maps capital bands per /513 2022 table", () => {
    expect(suggestCapitalBand(0).amount).toBe(20);
    expect(suggestCapitalBand(5).id).toBe("5");
    expect(suggestCapitalBand(5).amount).toBe(45);
    expect(suggestCapitalBand(10).amount).toBe(70);
    expect(suggestCapitalBand(11).id).toBe("11-19");
    expect(suggestCapitalBand(19).amount).toBe(76);
    expect(suggestCapitalBand(20).id).toBe("20-40");
    expect(suggestCapitalBand(21).amount).toBe(100);
    expect(suggestCapitalBand(40).amount).toBe(100);
    expect(suggestCapitalBand(41).amount).toBe(130);
  });

  it("matches fixture usages to $76 capital / $6.99 drought when band applies", () => {
    // Bills with ≤19 ccf land in 11–19 capital band ($76) and above-median drought
    for (const usage of [16, 17, 19, 18.5]) {
      expect(suggestCapitalBand(usage).amount).toBe(76);
      expect(suggestDroughtTier(usage).amount).toBe(6.99);
    }
    // 20–21 ccf → published capital table jumps to $100 (fixtures still billed $76 —
    // spring-band lag / avg; override keeps fixture math in calculateBill tests)
    expect(suggestCapitalBand(20).amount).toBe(100);
    expect(suggestCapitalBand(21).amount).toBe(100);
    expect(suggestDroughtTier(20).amount).toBe(6.99);
    expect(suggestDroughtTier(21).amount).toBe(6.99);
  });

  it("treats median boundary for drought", () => {
    expect(DROUGHT_MEDIAN_CCF).toBe(12);
    expect(suggestDroughtTier(12).id).toBe("below");
    expect(suggestDroughtTier(12).amount).toBe(2.32);
    expect(suggestDroughtTier(12.1).id).toBe("above");
    expect(suggestDroughtTier(0).amount).toBe(2.32);
  });

  it("floors fractional usage for capital bands", () => {
    expect(suggestCapitalBand(10.9).id).toBe("10");
    expect(suggestCapitalBand(19.9).id).toBe("11-19");
  });
});
