"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDroplet } from "@fortawesome/free-solid-svg-icons";
import { formatMoney, type BillInputs } from "@/lib/calculate";
import {
  buildSavingsScenario,
  defaultSimulatedUsage,
  formatCcf,
  SAVINGS_USAGE_FLOOR,
} from "@/lib/savings";

type Props = {
  /** Current bill inputs — used as the what-if baseline only (never mutated). */
  baseline: BillInputs;
};

const LINE_ORDER = [
  { key: "waterUse" as const, label: "Water use" },
  { key: "waterService" as const, label: "Water svc" },
  { key: "sewer" as const, label: "Sewer" },
  { key: "capital" as const, label: "Capital" },
  { key: "drought" as const, label: "Drought" },
];

function formatDelta(n: number): string {
  if (n === 0) return formatMoney(0);
  const abs = formatMoney(Math.abs(n));
  return n > 0 ? `−${abs}` : `+${abs}`;
}

export function SavingsCard({ baseline }: Props) {
  const baselineWater = Math.max(0, baseline.waterUseCcf);
  const [simWater, setSimWater] = useState(() =>
    defaultSimulatedUsage(baselineWater),
  );

  // When bill inputs change, reset the what-if slider to a fresh default.
  useEffect(() => {
    setSimWater(defaultSimulatedUsage(baseline.waterUseCcf));
  }, [
    baseline.rateYear,
    baseline.meterSize,
    baseline.waterUseCcf,
    baseline.winterSewerAvgCcf,
    baseline.capitalAmount,
    baseline.droughtAmount,
  ]);

  const scenario = useMemo(
    () => buildSavingsScenario(baseline, simWater),
    [baseline, simWater],
  );

  const max = baselineWater;
  const sliderDisabled = max <= SAVINGS_USAGE_FLOOR;

  return (
    <section className="savings-card" aria-labelledby="savings-card-title">
      <p className="savings-card__eyebrow" id="savings-card-title">
        <FontAwesomeIcon icon={faDroplet} className="savings-card__icon" />
        What could I save?
      </p>

      <p className="savings-card__sentence">
        If you used{" "}
        <strong className="savings-card__ccf">
          {formatCcf(scenario.simulatedWaterUse)} ccf
        </strong>{" "}
        instead of{" "}
        <strong className="savings-card__ccf">
          {formatCcf(scenario.baselineWaterUse)}
        </strong>
        … you&apos;d save about
      </p>

      <p className="savings-card__hero" aria-live="polite">
        <span className="savings-card__hero-amount">
          {formatMoney(scenario.savings.total)}
        </span>
        <span className="savings-card__hero-unit">per bill</span>
      </p>

      <div className="savings-card__slider-wrap">
        <label className="savings-card__slider-label" htmlFor="savings-usage">
          Dial usage down
        </label>
        <input
          id="savings-usage"
          className="savings-card__slider"
          type="range"
          min={SAVINGS_USAGE_FLOOR}
          max={max || SAVINGS_USAGE_FLOOR}
          step={0.5}
          value={Math.min(simWater, max)}
          disabled={sliderDisabled}
          aria-valuemin={SAVINGS_USAGE_FLOOR}
          aria-valuemax={max}
          aria-valuenow={scenario.simulatedWaterUse}
          aria-valuetext={`${formatCcf(scenario.simulatedWaterUse)} ccf`}
          onChange={(e) => setSimWater(Number(e.target.value))}
        />
        <div className="savings-card__slider-ends" aria-hidden="true">
          <span>{formatCcf(SAVINGS_USAGE_FLOOR)} ccf</span>
          <span>{formatCcf(max)} ccf</span>
        </div>
      </div>

      <p className="savings-card__note">
        Winter sewer avg scales with usage (same link as Bill inputs). Capital
        &amp; drought stay at your current selection.
      </p>

      <ul className="savings-card__lines">
        {LINE_ORDER.map(({ key, label }) => (
          <li key={key}>
            <span>{label}</span>
            <span className="savings-card__delta money">
              {formatDelta(scenario.savings[key])}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
