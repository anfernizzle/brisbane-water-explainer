"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDroplet } from "@fortawesome/free-solid-svg-icons";
import { formatMoney, type BillInputs } from "@/lib/calculate";
import {
  annualizeSavings,
  buildSavingsScenario,
  defaultSimulatedUsage,
  formatCcf,
  formatPercentWhole,
  SAVINGS_USAGE_FLOOR,
  waterReductionPercent,
} from "@/lib/savings";

type Props = {
  /** Current bill inputs — used as the what-if baseline only (never mutated). */
  baseline: BillInputs;
};

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

  const reductionPct = waterReductionPercent(
    scenario.baselineWaterUse,
    scenario.simulatedWaterUse,
  );
  const perBill = scenario.savings.total;
  const perYear = annualizeSavings(perBill);

  const max = baselineWater;
  const sliderDisabled = max <= SAVINGS_USAGE_FLOOR;

  return (
    <section className="savings-card" aria-labelledby="savings-card-title">
      <p className="savings-card__eyebrow" id="savings-card-title">
        <FontAwesomeIcon icon={faDroplet} className="savings-card__icon" />
        What could you save?
      </p>

      <p className="savings-card__lead">
        If you used{" "}
        <strong className="savings-card__em">
          {formatCcf(scenario.simulatedWaterUse)} ccf
        </strong>{" "}
        instead of{" "}
        <strong className="savings-card__em">
          {formatCcf(scenario.baselineWaterUse)}
        </strong>{" "}
        in{" "}
        <strong className="savings-card__em">{baseline.rateYear}</strong>
        …
      </p>

      <div className="savings-card__slider-wrap">
        <label className="visually-hidden" htmlFor="savings-usage">
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

      <p className="savings-card__payoff-lead">
        You&apos;d use about{" "}
        <strong className="savings-card__em">
          {formatPercentWhole(reductionPct)}%
        </strong>{" "}
        less water and save about…
      </p>

      <div className="savings-card__totals" aria-live="polite">
        <div className="savings-card__total">
          <span className="savings-card__total-amount">
            {formatMoney(perBill)}
          </span>
          <span className="savings-card__total-label">per bill</span>
        </div>
        <div className="savings-card__total">
          <span className="savings-card__total-amount">
            {formatMoney(perYear)}
          </span>
          <span className="savings-card__total-label">
            per year <span className="savings-card__total-hint">(×6 bills)</span>
          </span>
        </div>
      </div>

      <p className="savings-card__breakdown">
        That&apos;s{" "}
        <strong className="savings-card__em">
          {formatMoney(scenario.savings.waterUse)}
        </strong>{" "}
        savings on Water Use and{" "}
        <strong className="savings-card__em">
          {formatMoney(scenario.savings.sewer)}
        </strong>{" "}
        savings on Sewer Charges per bill.
      </p>

      <p className="savings-card__note">
        Winter sewer avg scales with usage similar to the relationship in bill
        inputs. Capital Project Charges &amp; Drought Contingency remain
        unchanged with this slider. This estimate assumes consistent usage
        across billing periods for the noted year&apos;s rate structure; actual
        usage and bills will vary. Billing rates go into effect starting June 15
        of that year until June 15 of the following calendar year. Figures are
        for informational purposes only and should not be treated as a precise
        forecast.
      </p>
    </section>
  );
}
