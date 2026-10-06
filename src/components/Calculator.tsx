"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Card,
  Col,
  Collapse,
  Form,
  OverlayTrigger,
  Row,
  Table,
  Tooltip,
} from "react-bootstrap";
import { BarChart } from "@mui/x-charts/BarChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faCircleInfo,
  faCaretDown,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";
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
  SEWER_RATES,
  SOURCE_LINKS,
  WATER_CONSUMPTION,
  type MeterSize,
  type RateYear,
} from "@/lib/rates";
import {
  applyWaterUseChange,
  applyWinterChange,
  estimateWinterSewerAvg,
  suggestCapitalBand,
  suggestDroughtTier,
  type DroughtPresetId,
  type LinkedUsageWinter,
} from "@/lib/suggestions";

type ResultView = "bill" | "years";

/** Material / Google palette for stacked bill segments */
const LINE_COLORS = {
  waterUse: "#4285F4",
  waterSvc: "#8AB4F8",
  sewer: "#34A853",
  capital: "#FBBC04",
  drought: "#EA4335",
} as const;

function InfoTip({ title }: { title: ReactNode }) {
  return (
    <OverlayTrigger
      placement="top"
      overlay={
        <Tooltip className="field-tip">
          <span>{title}</span>
        </Tooltip>
      }
    >
      <button type="button" className="tip-btn" aria-label="More information">
        <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 14 }} />
      </button>
    </OverlayTrigger>
  );
}

function FieldLabel({ label, tip }: { label: string; tip: ReactNode }) {
  return (
    <Form.Label className="d-flex align-items-center gap-1 mb-1">
      <span>{label}</span>
      <InfoTip title={tip} />
    </Form.Label>
  );
}

export function Calculator() {
  const [rateYear, setRateYear] = useState<RateYear>(DEFAULT_INPUTS.rateYear);
  const [meterSize, setMeterSize] = useState<MeterSize>(
    DEFAULT_INPUTS.meterSize,
  );
  const [usageWinter, setUsageWinter] = useState<LinkedUsageWinter>(() => ({
    waterUse: String(DEFAULT_INPUTS.waterUseCcf),
    winterAvg: String(estimateWinterSewerAvg(DEFAULT_INPUTS.waterUseCcf)),
    waterManual: false,
    winterManual: false,
  }));
  const waterUseCcf = usageWinter.waterUse;
  const winterSewerAvgCcf = usageWinter.winterAvg;

  const [capitalOverride, setCapitalOverride] = useState(false);
  const [capitalPresetId, setCapitalPresetId] = useState("11-19");

  const [droughtOverride, setDroughtOverride] = useState(false);
  const [droughtMode, setDroughtMode] = useState<DroughtPresetId>("above");

  const [inputsOpen, setInputsOpen] = useState(true);
  const [resultView, setResultView] = useState<ResultView>("bill");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const inputsAnchorRef = useRef<HTMLButtonElement | null>(null);

  const usageNum = Number(waterUseCcf) || 0;
  const capitalSuggested = useMemo(
    () => suggestCapitalBand(usageNum),
    [usageNum],
  );
  const droughtSuggested = useMemo(
    () => suggestDroughtTier(usageNum),
    [usageNum],
  );
  const waterRates = WATER_CONSUMPTION[rateYear];
  const sewerRates = SEWER_RATES[rateYear];

  useEffect(() => {
    if (!capitalOverride) {
      setCapitalPresetId(capitalSuggested.id);
    }
  }, [capitalSuggested.id, capitalOverride]);

  useEffect(() => {
    if (!droughtOverride) {
      setDroughtMode(droughtSuggested.id);
    }
  }, [droughtSuggested.id, droughtOverride]);

  const capitalAmount = capitalOverride
    ? (CAPITAL_PRESETS.find((p) => p.id === capitalPresetId)?.amount ??
      capitalSuggested.amount)
    : capitalSuggested.amount;

  const droughtAmount =
    droughtMode === "below"
      ? (DROUGHT_PRESETS.find((p) => p.id === "below")?.amount ?? 2.32)
      : (DROUGHT_PRESETS.find((p) => p.id === "above")?.amount ?? 6.99);

  const inputs: BillInputs = useMemo(
    () => ({
      rateYear,
      meterSize,
      waterUseCcf: usageNum,
      winterSewerAvgCcf: Number(winterSewerAvgCcf) || 0,
      capitalAmount,
      droughtAmount,
    }),
    [
      rateYear,
      meterSize,
      usageNum,
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

  const lineItems = result.lines.filter((l) => l.id !== "total");
  const totalLine = result.lines.find((l) => l.id === "total")!;

  useEffect(() => {
    const el = inputsAnchorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setInputsOpen(false);
        }
      },
      { threshold: 0, rootMargin: "-8% 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function toggleInputs() {
    setInputsOpen((v) => !v);
  }

  function toggleLine(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const chartDataset = projections.map((p) => ({
    year: String(p.rateYear),
    waterUse: p.result.waterUse,
    waterSvc: p.result.waterService,
    sewer: p.result.sewer,
    capital: p.result.capital,
    drought: p.result.drought,
  }));
  const chartYearLabels = chartDataset.map((d) => d.year);

  const tableRows: Array<{
    id: keyof typeof LINE_COLORS | "total";
    label: string;
    values: number[];
    color?: string;
    emphasize?: boolean;
  }> = [
    {
      id: "waterUse",
      label: "Water use",
      color: LINE_COLORS.waterUse,
      values: projections.map((p) => p.result.waterUse),
    },
    {
      id: "waterSvc",
      label: "Water svc",
      color: LINE_COLORS.waterSvc,
      values: projections.map((p) => p.result.waterService),
    },
    {
      id: "sewer",
      label: "Sewer",
      color: LINE_COLORS.sewer,
      values: projections.map((p) => p.result.sewer),
    },
    {
      id: "capital",
      label: "Capital",
      color: LINE_COLORS.capital,
      values: projections.map((p) => p.result.capital),
    },
    {
      id: "drought",
      label: "Drought",
      color: LINE_COLORS.drought,
      values: projections.map((p) => p.result.drought),
    },
    {
      id: "total",
      label: "Total",
      values: projections.map((p) => p.result.total),
      emphasize: true,
    },
  ];

  const LABEL_COL_PX = 140;

  return (
    <div className="calc-stack">
      {/* INPUTS */}
      <Card>
        <button
          ref={inputsAnchorRef}
          type="button"
          className="card-header section-header d-flex align-items-center gap-2 w-100 text-start border-0"
          onClick={toggleInputs}
          aria-expanded={inputsOpen}
          aria-controls="bill-inputs-panel"
        >
          <span className="section-title">Bill inputs</span>
          {!inputsOpen && (
            <span className="inputs-summary flex-grow-1">
              <span className="inputs-summary__item">
                <span className="inputs-summary__key">Year</span>
                {rateYear}
              </span>
              <span className="inputs-summary__item">
                {meterSize} Meter
              </span>
              <span className="inputs-summary__item">
                <span className="inputs-summary__key">Usage</span>
                {waterUseCcf || 0} CCF
              </span>
              <span className="inputs-summary__item">
                <span className="inputs-summary__key">Winter Sewer Avg</span>
                {winterSewerAvgCcf || 0}
              </span>
            </span>
          )}
          <span className="ms-auto">
            <FontAwesomeIcon
              icon={inputsOpen ? faCaretUp : faCaretDown}
              className="collapse-caret"
              aria-hidden
            />
          </span>
        </button>
        <Collapse in={inputsOpen}>
          <div id="bill-inputs-panel">
            <Card.Body>
              <Row className="inputs-grid g-3">
                <Col xs={6} sm={3}>
                  <FieldLabel
                    label="Rate year"
                    tip="Approved maxima through 2027. Rates effective June 15 appear on the August bill."
                  />
                  <Form.Select
                    value={rateYear}
                    aria-label="Rate year"
                    onChange={(e) =>
                      setRateYear(Number(e.target.value) as RateYear)
                    }
                  >
                    {RATE_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y} (eff. {RATE_YEAR_EFFECTIVE[y]})
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={6} sm={3}>
                  <FieldLabel
                    label="Meter size"
                    tip='5/8" and 3/4" share the same fixed water service rate.'
                  />
                  <Form.Select
                    value={meterSize}
                    aria-label="Meter size"
                    onChange={(e) =>
                      setMeterSize(e.target.value as MeterSize)
                    }
                  >
                    {METER_SIZES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={6} sm={3}>
                  <FieldLabel
                    label="Water use (ccf)"
                    tip={
                      <span>
                        <strong>CCF</strong> = hundred cubic feet (~748 gal),
                        bimonthly. Also proxies capital/drought bands.{" "}
                        {rateYear} water use: {formatMoney(waterRates.tier1)}
                        /ccf (units 2–20), {formatMoney(waterRates.tier2)}/ccf
                        (over 20). Winter sewer:{" "}
                        {formatMoney(sewerRates.variable)}/ccf of winter avg (+
                        fixed {formatMoney(sewerRates.fixed)}).
                      </span>
                    }
                  />
                  <Form.Control
                    type="number"
                    min={0}
                    step={1}
                    value={waterUseCcf}
                    aria-label="Water use ccf"
                    onChange={(e) =>
                      setUsageWinter((s) =>
                        applyWaterUseChange(s, e.target.value),
                      )
                    }
                  />
                </Col>
                <Col xs={6} sm={3}>
                  <FieldLabel
                    label="Winter sewer avg"
                    tip={
                      <span>
                        Mid-Oct → mid-Feb average that{" "}
                        <strong>directly sets the sewer charge</strong> (
                        {formatMoney(sewerRates.variable)}/ccf in {rateYear} +
                        fixed). Default is water use × 1.15 (nearest 0.5) — an
                        estimate; check your bill and correct it. Clear the
                        field to let water use drive it again.
                      </span>
                    }
                  />
                  <Form.Control
                    type="number"
                    min={0}
                    step={0.5}
                    value={winterSewerAvgCcf}
                    aria-label="Winter sewer average ccf"
                    onChange={(e) =>
                      setUsageWinter((s) =>
                        applyWinterChange(s, e.target.value),
                      )
                    }
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <FieldLabel
                    label="Capital project charge"
                    tip={
                      <span>
                        Auto from entered water use as a proxy for the City{" "}
                        <a
                          href="https://www.brisbaneca.gov/513/Capital-Projects-Charge"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Capital Projects Charge
                        </a>{" "}
                        spring-usage bands. Pick another band if your bill
                        differs.
                      </span>
                    }
                  />
                  <Form.Select
                    value={capitalPresetId}
                    aria-label="Capital band"
                    onChange={(e) => {
                      const next = e.target.value;
                      setCapitalPresetId(next);
                      setCapitalOverride(next !== capitalSuggested.id);
                    }}
                  >
                    {CAPITAL_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={12} sm={6}>
                  <FieldLabel
                    label="Drought contingency"
                    tip={
                      <span>
                        Auto below/above median (12 units) from water-use proxy
                        per City{" "}
                        <a
                          href="https://www.brisbaneca.gov/512/Drought-Contingency-Charge"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Drought Contingency Charge
                        </a>
                        . Pick the other tier if your bill differs.
                      </span>
                    }
                  />
                  <Form.Select
                    value={droughtMode}
                    aria-label="Drought tier"
                    onChange={(e) => {
                      const next = e.target.value as DroughtPresetId;
                      setDroughtMode(next);
                      setDroughtOverride(next !== droughtSuggested.id);
                    }}
                  >
                    {DROUGHT_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </div>
        </Collapse>
      </Card>

      {/* ESTIMATED BILL */}
      <Card>
        <Card.Header className="section-header estimated-header">
          <div className="estimated-header__row">
            <span className="section-title">Estimated bill</span>
            <div
              className="segmented-toggle"
              data-view={resultView}
              role="radiogroup"
              aria-label="Bill result view"
            >
              <span className="segmented-toggle__thumb" aria-hidden />
              <button
                type="button"
                role="radio"
                aria-checked={resultView === "bill"}
                className={`segmented-toggle__option${
                  resultView === "bill"
                    ? " segmented-toggle__option--active"
                    : ""
                }`}
                onClick={() => setResultView("bill")}
              >
                {rateYear} detail
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={resultView === "years"}
                className={`segmented-toggle__option${
                  resultView === "years"
                    ? " segmented-toggle__option--active"
                    : ""
                }`}
                onClick={() => setResultView("years")}
              >
                All years
              </button>
            </div>
          </div>
          {resultView === "bill" && (
            <p className="bill-detail-footnote mb-0">
              Tap any line to see how it&apos;s calculated.
            </p>
          )}
        </Card.Header>

        {resultView === "bill" ? (
          <>
            <Card.Body className="py-2 px-2">
              {lineItems.map((line) => {
                const isOpen = !!expanded[line.id];
                return (
                  <div key={line.id}>
                    <button
                      type="button"
                      className="bill-line"
                      aria-expanded={isOpen}
                      onClick={() => toggleLine(line.id)}
                    >
                      <FontAwesomeIcon
                        icon={isOpen ? faChevronDown : faChevronRight}
                        className="bill-line__chevron"
                        aria-hidden
                      />
                      <span className="bill-line__label">{line.label}</span>
                      <span className="bill-line__amount money">
                        {formatMoney(line.amount)}
                      </span>
                    </button>
                    <Collapse in={isOpen}>
                      <p className="bill-line__formula">{line.formula}</p>
                    </Collapse>
                  </div>
                );
              })}
            </Card.Body>
            <div className="amount-due">
              <button
                type="button"
                className="amount-due__row"
                aria-expanded={!!expanded.total}
                onClick={() => toggleLine("total")}
              >
                <span className="amount-due__label">
                  Amount due – {rateYear}
                </span>
                <span className="amount-due__total money">
                  {formatMoney(totalLine.amount)}
                </span>
              </button>
              <Collapse in={!!expanded.total}>
                <p className="amount-due__formula mb-0">{totalLine.formula}</p>
              </Collapse>
            </div>
          </>
        ) : (
          <Card.Body className="years-panel">
            <p className="text-secondary mb-3">
              Same inputs under approved maxima through 2027. Capital & drought
              held at current selection.
            </p>
            <div className="chart-glass">
              <BarChart
                dataset={chartDataset}
                xAxis={[
                  {
                    dataKey: "year",
                    scaleType: "band",
                    categoryGapRatio: 0.35,
                    tickPlacement: "middle",
                    tickLabelPlacement: "middle",
                    tickLabelStyle: {
                      fontSize: 13,
                      fontWeight: 700,
                      fill: "#111111",
                    },
                    valueFormatter: (value: string | number) => String(value),
                  },
                ]}
                yAxis={[
                  {
                    width: 56,
                    tickLabelStyle: { fontSize: 12, fill: "#111111" },
                    valueFormatter: (value: number | null) => {
                      if (value == null || Number.isNaN(Number(value))) {
                        return "";
                      }
                      return `$${Math.round(Number(value)).toLocaleString("en-US")}`;
                    },
                  },
                ]}
                series={[
                  {
                    dataKey: "waterUse",
                    label: "Water use",
                    stack: "bill",
                    color: LINE_COLORS.waterUse,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                  {
                    dataKey: "waterSvc",
                    label: "Water svc",
                    stack: "bill",
                    color: LINE_COLORS.waterSvc,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                  {
                    dataKey: "sewer",
                    label: "Sewer",
                    stack: "bill",
                    color: LINE_COLORS.sewer,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                  {
                    dataKey: "capital",
                    label: "Capital",
                    stack: "bill",
                    color: LINE_COLORS.capital,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                  {
                    dataKey: "drought",
                    label: "Drought",
                    stack: "bill",
                    color: LINE_COLORS.drought,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                ]}
                margin={{
                  left: 8,
                  right: 8,
                  top: 40,
                  bottom: 36,
                }}
                grid={{ horizontal: true }}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "top", horizontal: "center" },
                  },
                }}
                sx={{
                  width: "100%",
                  height: "100%",
                  "& .MuiChartsAxis-directionX .MuiChartsAxis-tickLabel": {
                    fill: "#111111",
                    fontWeight: 700,
                  },
                  "& .MuiChartsGrid-line": {
                    stroke: "rgba(17, 17, 17, 0.12)",
                  },
                  "& .MuiChartsLegend-series text": {
                    fill: "#111111",
                  },
                }}
              />
            </div>

            <div className="table-responsive">
              <Table className="table-years mb-2">
                <colgroup>
                  <col style={{ width: LABEL_COL_PX }} />
                  {chartYearLabels.map((y) => (
                    <col key={y} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th className="label-col">Line item</th>
                    {chartYearLabels.map((y) => (
                      <th
                        key={y}
                        className={`year-col${
                          Number(y) === rateYear ? " year-current" : ""
                        }`}
                      >
                        {y}
                        {y === "2027" ? " *" : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr
                      key={row.id}
                      className={row.emphasize ? "total-row" : undefined}
                    >
                      <th
                        scope="row"
                        className="label-col"
                        style={{
                          fontWeight: row.emphasize ? 700 : 600,
                          color: row.emphasize
                            ? "var(--ink)"
                            : "var(--ink-soft)",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {row.color ? (
                          <span
                            className="line-swatch"
                            style={{ backgroundColor: row.color }}
                            aria-hidden
                          />
                        ) : null}
                        {row.label}
                      </th>
                      {row.values.map((value, idx) => {
                        const y = Number(chartYearLabels[idx]);
                        return (
                          <td
                            key={`${row.id}-${y}`}
                            className={`year-col money${
                              y === rateYear ? " year-current" : ""
                            }`}
                          >
                            {formatMoney(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <p className="years-footnote">
              * 2027 is the last City-approved maximum schedule.
            </p>
          </Card.Body>
        )}
      </Card>

      {/* DISCLAIMER */}
      <Alert variant="primary" className="disclaimer-alert mb-0">
        <div className="disclaimer-split">
          <div>
            <h2 className="disclaimer-alert__title">Unofficial explainer</h2>
            <p className="footnote mb-0">
              This is <strong>not</strong> an official City of Brisbane tool. It
              estimates residential water/sewer bills from published rate tables
              and Prop 218 maximums. Capital and drought auto-suggestions use
              your entered water use as a proxy (City capital bands are spring
              usage; drought uses a yearly average vs median 12) — pick another
              band or tier when your bill differs. Does not include LIRA, AB
              3030 pass-throughs, late fees, or prior balances. Always trust
              your actual bill.
            </p>
          </div>
          <div>
            <h2 className="disclaimer-alert__title">Sources</h2>
            <ul className="disclaimer-alert__sources">
              {SOURCE_LINKS.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Alert>
    </div>
  );
}
