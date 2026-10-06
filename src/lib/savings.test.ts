import { describe, expect, it } from "vitest";
import {
  buildSavingsScenario,
  clampSimulatedUsage,
  defaultSimulatedUsage,
  formatCcf,
  scaleWinterWithUsage,
} from "./savings";
import { estimateWinterSewerAvg } from "./suggestions";
import type { BillInputs } from "./calculate";

const baseInputs: BillInputs = {
  rateYear: 2025,
  meterSize: '5/8"',
  waterUseCcf: 19,
  winterSewerAvgCcf: 22,
  capitalAmount: 76,
  droughtAmount: 6.99,
};

describe("scaleWinterWithUsage", () => {
  it("preserves ×1.15-linked pair when scaled (nearest 0.5)", () => {
    expect(scaleWinterWithUsage(19, 22, 19)).toBe(22);
    expect(scaleWinterWithUsage(19, 22, 10)).toBe(11.5);
    expect(estimateWinterSewerAvg(10)).toBe(11.5);
    expect(scaleWinterWithUsage(19, 22, 0)).toBe(0);
  });

  it("preserves a custom winter/usage ratio when scaling", () => {
    // 18.5 / 19 ≈ fixture-style manual winter
    expect(scaleWinterWithUsage(19, 18.5, 9.5)).toBe(9.5);
  });

  it("returns 0 when baseline water is 0", () => {
    expect(scaleWinterWithUsage(0, 22, 5)).toBe(0);
  });
});

describe("clampSimulatedUsage / defaultSimulatedUsage", () => {
  it("clamps to [0, baseline]", () => {
    expect(clampSimulatedUsage(25, 19)).toBe(19);
    expect(clampSimulatedUsage(-1, 19)).toBe(0);
    expect(clampSimulatedUsage(10, 19)).toBe(10);
  });

  it("defaults to about half baseline (nearest 0.5)", () => {
    expect(defaultSimulatedUsage(19)).toBe(9.5);
    expect(defaultSimulatedUsage(10)).toBe(5);
    expect(defaultSimulatedUsage(0)).toBe(0);
  });
});

describe("buildSavingsScenario", () => {
  it("holds capital and drought at baseline amounts", () => {
    const scenario = buildSavingsScenario(baseInputs, 10);
    expect(scenario.simulated.capital).toBe(76);
    expect(scenario.simulated.drought).toBe(6.99);
    expect(scenario.savings.capital).toBe(0);
    expect(scenario.savings.drought).toBe(0);
  });

  it("saves on water use and sewer when usage drops; total matches sum", () => {
    const scenario = buildSavingsScenario(baseInputs, 10);
    expect(scenario.simulatedWaterUse).toBe(10);
    expect(scenario.simulatedWinter).toBe(11.5);
    expect(scenario.savings.waterUse).toBeGreaterThan(0);
    expect(scenario.savings.sewer).toBeGreaterThan(0);
    expect(scenario.savings.waterService).toBe(0);
    const sum =
      scenario.savings.waterUse +
      scenario.savings.waterService +
      scenario.savings.sewer +
      scenario.savings.capital +
      scenario.savings.drought;
    expect(scenario.savings.total).toBeCloseTo(sum, 2);
    expect(scenario.savings.total).toBe(
      Math.round((scenario.baseline.total - scenario.simulated.total) * 100) /
        100,
    );
  });

  it("reports zero savings when simulated equals baseline", () => {
    const scenario = buildSavingsScenario(baseInputs, 19);
    expect(scenario.savings.total).toBe(0);
    expect(scenario.savings.waterUse).toBe(0);
    expect(scenario.savings.sewer).toBe(0);
  });

  it("does not mutate conceptual baseline when simulating zero usage", () => {
    const scenario = buildSavingsScenario(baseInputs, 0);
    expect(scenario.baselineWaterUse).toBe(19);
    expect(scenario.simulatedWaterUse).toBe(0);
    expect(scenario.savings.total).toBeGreaterThan(0);
  });
});

describe("formatCcf", () => {
  it("omits trailing .0 for whole numbers", () => {
    expect(formatCcf(19)).toBe("19");
    expect(formatCcf(9.5)).toBe("9.5");
  });
});
