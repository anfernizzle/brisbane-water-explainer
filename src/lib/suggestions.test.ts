import { describe, expect, it } from "vitest";
import {
  suggestCapitalBand,
  suggestDroughtTier,
  estimateWinterSewerAvg,
  estimateWaterUseFromWinter,
  applyWaterUseChange,
  applyWinterChange,
  isUnsetUsageField,
  DROUGHT_MEDIAN_CCF,
  type LinkedUsageWinter,
} from "./suggestions";

describe("estimateWinterSewerAvg", () => {
  it("uses water use × 1.15 rounded to nearest 0.5 ccf", () => {
    expect(estimateWinterSewerAvg(19)).toBe(22);
    expect(estimateWinterSewerAvg(16)).toBe(18.5);
    expect(estimateWinterSewerAvg(0)).toBe(0);
    expect(estimateWinterSewerAvg(10)).toBe(11.5);
  });
});

describe("estimateWaterUseFromWinter", () => {
  it("uses winter ÷ 1.15 rounded to nearest 0.5 ccf", () => {
    expect(estimateWaterUseFromWinter(22)).toBe(19);
    expect(estimateWaterUseFromWinter(18.5)).toBe(16);
    expect(estimateWaterUseFromWinter(0)).toBe(0);
  });
});

describe("linked water use ↔ winter sewer defaults", () => {
  const linked: LinkedUsageWinter = {
    waterUse: "19",
    winterAvg: "22",
    waterManual: false,
    winterManual: false,
  };

  it("clear winter → change usage → winter refills", () => {
    const cleared = applyWinterChange(linked, "");
    expect(cleared.winterManual).toBe(false);
    expect(isUnsetUsageField(cleared.winterAvg)).toBe(true);

    const next = applyWaterUseChange(cleared, "16");
    expect(next.waterManual).toBe(true);
    expect(next.winterManual).toBe(false);
    expect(next.winterAvg).toBe("18.5");
  });

  it("clear usage → set winter → usage refills", () => {
    const cleared = applyWaterUseChange(linked, "");
    expect(cleared.waterManual).toBe(false);
    expect(isUnsetUsageField(cleared.waterUse)).toBe(true);

    const next = applyWinterChange(cleared, "22");
    expect(next.winterManual).toBe(true);
    expect(next.waterManual).toBe(false);
    expect(next.waterUse).toBe("19");
  });

  it("manual values stick when the other field changes", () => {
    const waterManual = applyWaterUseChange(linked, "19");
    const winterManual = applyWinterChange(waterManual, "18.5");
    expect(winterManual.waterUse).toBe("19");
    expect(winterManual.winterAvg).toBe("18.5");
    expect(winterManual.waterManual).toBe(true);
    expect(winterManual.winterManual).toBe(true);

    const afterWater = applyWaterUseChange(winterManual, "21");
    expect(afterWater.winterAvg).toBe("18.5");
    expect(afterWater.waterUse).toBe("21");

    const afterWinter = applyWinterChange(afterWater, "20");
    expect(afterWinter.waterUse).toBe("21");
    expect(afterWinter.winterAvg).toBe("20");
  });

  it("zeroing a field clears its manual flag", () => {
    const manual = applyWinterChange(applyWaterUseChange(linked, "19"), "18.5");
    const clearedWinter = applyWinterChange(manual, "0");
    expect(clearedWinter.winterManual).toBe(false);
    const refilled = applyWaterUseChange(clearedWinter, "19");
    expect(refilled.winterAvg).toBe("22");
  });
});

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
    for (const usage of [16, 17, 19, 18.5]) {
      expect(suggestCapitalBand(usage).amount).toBe(76);
      expect(suggestDroughtTier(usage).amount).toBe(6.99);
    }
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
