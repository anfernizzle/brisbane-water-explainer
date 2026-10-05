"use client";

import { useMemo, useState } from "react";
import {
  calculateBill,
  formatMoney,
  projectAcrossYears,
  type BillInputs,
} from "@/lib/calculate";
import {
  CAPITAL_PRESETS,
  DEFAULT_INPUTS,
  DROUGHT_PRESETS,
  METER_SIZES,
  RATE_YEAR_EFFECTIVE,
  RATE_YEARS,
  SOURCE_LINKS,
  type MeterSize,
  type RateYear,
} from "@/lib/rates";

type CapitalMode = "preset" | "manual";
type DroughtMode = "below" | "above" | "manual";

export function Calculator() {
  const [rateYear, setRateYear] = useState<RateYear>(DEFAULT_INPUTS.rateYear);
  const [meterSize, setMeterSize] = useState<MeterSize>(
    DEFAULT_INPUTS.meterSize,
  );
  const [waterUseCcf, setWaterUseCcf] = useState(
    String(DEFAULT_INPUTS.waterUseCcf),
  );
  const [winterSewerAvgCcf, setWinterSewerAvgCcf] = useState(
    String(DEFAULT_INPUTS.winterSewerAvgCcf),
  );

  const [capitalMode, setCapitalMode] = useState<CapitalMode>("preset");
  const [capitalPresetId, setCapitalPresetId] = useState("11-19");
  const [capitalManual, setCapitalManual] = useState(
    String(DEFAULT_INPUTS.capitalAmount),
  );

  const [droughtMode, setDroughtMode] = useState<DroughtMode>("above");
  const [droughtManual, setDroughtManual] = useState(
    String(DEFAULT_INPUTS.droughtAmount),
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const capitalAmount =
    capitalMode === "preset"
      ? (CAPITAL_PRESETS.find((p) => p.id === capitalPresetId)?.amount ?? 76)
      : Number(capitalManual) || 0;

  const droughtAmount =
    droughtMode === "below"
      ? 2.32
      : droughtMode === "above"
        ? 6.99
        : Number(droughtManual) || 0;

  const inputs: BillInputs = useMemo(
    () => ({
      rateYear,
      meterSize,
      waterUseCcf: Number(waterUseCcf) || 0,
      winterSewerAvgCcf: Number(winterSewerAvgCcf) || 0,
      capitalAmount,
      droughtAmount,
    }),
    [
      rateYear,
      meterSize,
      waterUseCcf,
      winterSewerAvgCcf,
      capitalAmount,
      droughtAmount,
    ],
  );

  const result = useMemo(() => calculateBill(inputs), [inputs]);
  const projections = useMemo(
    () =>
      projectAcrossYears({
        meterSize: inputs.meterSize,
        waterUseCcf: inputs.waterUseCcf,
        winterSewerAvgCcf: inputs.winterSewerAvgCcf,
        capitalAmount: inputs.capitalAmount,
        droughtAmount: inputs.droughtAmount,
      }),
    [inputs],
  );

  function toggleLine(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="calculator">
      <section className="panel" aria-labelledby="inputs-heading">
        <h2 id="inputs-heading">Bill inputs</h2>

        <div className="field-grid">
          <label className="field">
            <span>Rate year</span>
            <select
              value={rateYear}
              onChange={(e) => setRateYear(Number(e.target.value) as RateYear)}
            >
              {RATE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y} (eff. {RATE_YEAR_EFFECTIVE[y]})
                </option>
              ))}
            </select>
            <span className="hint">
              Approved maxima through 2027. Rates effective June 15 appear on
              the August bill.
            </span>
          </label>

          <label className="field">
            <span>Meter size</span>
            <select
              value={meterSize}
              onChange={(e) => setMeterSize(e.target.value as MeterSize)}
            >
              {METER_SIZES.map((m) => (
                <option key={m} value={m}>
                  {m}
                  {m === '5/8"' || m === '3/4"' ? " (same fixed rate)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Water use (ccf)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={waterUseCcf}
              onChange={(e) => setWaterUseCcf(e.target.value)}
            />
            <span className="hint">Bimonthly usage in hundreds of cubic feet.</span>
          </label>

          <label className="field">
            <span>Winter sewer average (ccf)</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={winterSewerAvgCcf}
              onChange={(e) => setWinterSewerAvgCcf(e.target.value)}
            />
            <span className="hint">
              Mid-October → mid-February average. Half-units allowed. Pre-filled
              18.5 from sample bills; edit if yours differs.
            </span>
          </label>
        </div>

        <fieldset className="fieldset">
          <legend>Capital project charge</legend>
          <div className="radio-row">
            <label>
              <input
                type="radio"
                name="capitalMode"
                checked={capitalMode === "preset"}
                onChange={() => setCapitalMode("preset")}
              />
              Spring-usage band preset
            </label>
            <label>
              <input
                type="radio"
                name="capitalMode"
                checked={capitalMode === "manual"}
                onChange={() => setCapitalMode("manual")}
              />
              Manual amount
            </label>
          </div>
          {capitalMode === "preset" ? (
            <label className="field">
              <span className="sr-only">Capital preset</span>
              <select
                value={capitalPresetId}
                onChange={(e) => setCapitalPresetId(e.target.value)}
              >
                {CAPITAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="field">
              <span className="sr-only">Capital amount</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={capitalManual}
                onChange={(e) => setCapitalManual(e.target.value)}
              />
            </label>
          )}
          <p className="hint">
            From the City{" "}
            <a
              href="https://www.brisbaneca.gov/513/Capital-Projects-Charge"
              target="_blank"
              rel="noopener noreferrer"
            >
              Capital Projects Charge
            </a>{" "}
            page: graduated by springtime usage (mid-February – mid-June), per
            2-month cycle (2022 adopted rates). How multiple spring periods
            combine into one band is not fully specified — enter what your bill
            shows or pick a band.
          </p>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Drought contingency</legend>
          <div className="radio-row">
            <label>
              <input
                type="radio"
                name="droughtMode"
                checked={droughtMode === "below"}
                onChange={() => setDroughtMode("below")}
              />
              Below median — $2.32
            </label>
            <label>
              <input
                type="radio"
                name="droughtMode"
                checked={droughtMode === "above"}
                onChange={() => setDroughtMode("above")}
              />
              Above median — $6.99
            </label>
            <label>
              <input
                type="radio"
                name="droughtMode"
                checked={droughtMode === "manual"}
                onChange={() => setDroughtMode("manual")}
              />
              Manual
            </label>
          </div>
          {droughtMode === "manual" && (
            <label className="field">
              <span className="sr-only">Drought amount</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={droughtManual}
                onChange={(e) => setDroughtManual(e.target.value)}
              />
            </label>
          )}
          <p className="hint">
            From the City{" "}
            <a
              href="https://www.brisbaneca.gov/512/Drought-Contingency-Charge"
              target="_blank"
              rel="noopener noreferrer"
            >
              Drought Contingency Charge
            </a>{" "}
            page: $2.32 / $6.99 per billing when yearly average is below / above
            the median (currently 12 units). Exact yearly-average window is
            unpublished — use the amount on your bill if unsure.
          </p>
        </fieldset>
      </section>

      <section className="panel" aria-labelledby="result-heading">
        <h2 id="result-heading">Estimated bill lines</h2>
        <p className="hint">
          Click a line to show the formula. Amounts use City-approved maximum
          rates (Prop 218). Over-20 water uses the published table, not any
          billed anomaly.
        </p>

        <ul className="bill-lines">
          {result.lines.map((line) => {
            const isTotal = line.id === "total";
            const isOpen = expanded[line.id];
            return (
              <li
                key={line.id}
                className={isTotal ? "bill-line bill-line--total" : "bill-line"}
              >
                <button
                  type="button"
                  className="bill-line__toggle"
                  aria-expanded={isOpen}
                  onClick={() => toggleLine(line.id)}
                >
                  <span className="bill-line__label">{line.label}</span>
                  <span className="bill-line__amount">
                    {formatMoney(line.amount)}
                  </span>
                  <span className="bill-line__chevron" aria-hidden>
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>
                {isOpen && (
                  <p className="bill-line__formula">{line.formula}</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel" aria-labelledby="compare-heading">
        <h2 id="compare-heading">Same inputs under approved years</h2>
        <p className="hint">
          Capital and drought held constant (manual/presets). Water and sewer
          use each year&apos;s approved maxima through 2027.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Water use</th>
                <th scope="col">Water svc</th>
                <th scope="col">Sewer</th>
                <th scope="col">Capital</th>
                <th scope="col">Drought</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {projections.map(({ rateYear: y, result: r }) => (
                <tr
                  key={y}
                  className={y === rateYear ? "row-current" : undefined}
                >
                  <th scope="row">
                    {y}
                    {y === 2027 ? " *" : ""}
                  </th>
                  <td>{formatMoney(r.waterUse)}</td>
                  <td>{formatMoney(r.waterService)}</td>
                  <td>{formatMoney(r.sewer)}</td>
                  <td>{formatMoney(r.capital)}</td>
                  <td>{formatMoney(r.drought)}</td>
                  <td>
                    <strong>{formatMoney(r.total)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">* 2027 is the last City-approved maximum schedule.</p>
      </section>

      <section className="panel panel--disclaimer" aria-labelledby="disclaimer-heading">
        <h2 id="disclaimer-heading">Unofficial explainer</h2>
        <p>
          This is <strong>not</strong> an official City of Brisbane tool. It
          estimates residential water/sewer bills from published rate tables and
          Prop 218 maximums. It does not include LIRA (25% discount for CARE
          enrollees), AB 3030 pass-throughs, late fees, or prior balances. Always
          trust your actual bill.
        </p>
        <h3>Sources</h3>
        <ul className="sources">
          {SOURCE_LINKS.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
