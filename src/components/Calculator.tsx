"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Collapse,
  Form,
  OverlayTrigger,
  Row,
  Table,
  ToggleButton,
  Tooltip,
} from "react-bootstrap";
import { LineChart } from "@mui/x-charts/LineChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faCircleInfo,
  faCaretDown,
  faCaretUp,
  faRotateLeft,
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
  METER_SIZES,
  RATE_YEAR_EFFECTIVE,
  RATE_YEARS,
  SOURCE_LINKS,
  type MeterSize,
  type RateYear,
} from "@/lib/rates";
import { suggestCapitalBand, suggestDroughtTier } from "@/lib/suggestions";

type DroughtMode = "below" | "above" | "manual";
type ResultView = "bill" | "years";

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
        <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 13 }} />
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
  const [waterUseCcf, setWaterUseCcf] = useState(
    String(DEFAULT_INPUTS.waterUseCcf),
  );
  const [winterSewerAvgCcf, setWinterSewerAvgCcf] = useState(
    String(DEFAULT_INPUTS.winterSewerAvgCcf),
  );

  const [capitalOverride, setCapitalOverride] = useState(false);
  const [capitalPresetId, setCapitalPresetId] = useState("11-19");
  const [capitalManual, setCapitalManual] = useState(false);
  const [capitalManualAmount, setCapitalManualAmount] = useState(
    String(DEFAULT_INPUTS.capitalAmount),
  );

  const [droughtOverride, setDroughtOverride] = useState(false);
  const [droughtMode, setDroughtMode] = useState<DroughtMode>("above");
  const [droughtManual, setDroughtManual] = useState(
    String(DEFAULT_INPUTS.droughtAmount),
  );

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

  useEffect(() => {
    if (!capitalOverride && !capitalManual) {
      setCapitalPresetId(capitalSuggested.id);
    }
  }, [capitalSuggested.id, capitalOverride, capitalManual]);

  useEffect(() => {
    if (!droughtOverride) {
      setDroughtMode(droughtSuggested.id);
    }
  }, [droughtSuggested.id, droughtOverride]);

  const capitalAmount = capitalManual
    ? Number(capitalManualAmount) || 0
    : capitalOverride
      ? (CAPITAL_PRESETS.find((p) => p.id === capitalPresetId)?.amount ??
        capitalSuggested.amount)
      : capitalSuggested.amount;

  const droughtAmount =
    droughtMode === "manual"
      ? Number(droughtManual) || 0
      : droughtMode === "below"
        ? 2.32
        : 6.99;

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

  function resetCapitalSuggested() {
    setCapitalOverride(false);
    setCapitalManual(false);
    setCapitalPresetId(capitalSuggested.id);
  }

  function resetDroughtSuggested() {
    setDroughtOverride(false);
    setDroughtMode(droughtSuggested.id);
  }

  const collapsedSummary = `${rateYear} · ${meterSize} · ${waterUseCcf || 0} ccf · winter ${winterSewerAvgCcf || 0} · capital ${formatMoney(capitalAmount)} · drought ${formatMoney(droughtAmount)}`;

  const chartDataset = projections.map((p) => ({
    year: String(p.rateYear),
    total: p.result.total,
    water: p.result.waterUse + p.result.waterService,
    sewer: p.result.sewer,
  }));
  const chartYearLabels = chartDataset.map((d) => d.year);

  const tableRows: Array<{
    id: string;
    label: string;
    values: number[];
    emphasize?: boolean;
  }> = [
    {
      id: "waterUse",
      label: "Water use",
      values: projections.map((p) => p.result.waterUse),
    },
    {
      id: "waterSvc",
      label: "Water svc",
      values: projections.map((p) => p.result.waterService),
    },
    {
      id: "sewer",
      label: "Sewer",
      values: projections.map((p) => p.result.sewer),
    },
    {
      id: "capital",
      label: "Capital",
      values: projections.map((p) => p.result.capital),
    },
    {
      id: "drought",
      label: "Drought",
      values: projections.map((p) => p.result.drought),
    },
    {
      id: "total",
      label: "Total",
      values: projections.map((p) => p.result.total),
      emphasize: true,
    },
  ];

  const LABEL_COL_PX = 120;

  return (
    <div className="d-flex flex-column gap-3">
      {/* INPUTS */}
      <Card>
        <button
          ref={inputsAnchorRef}
          type="button"
          className="card-header d-flex align-items-center gap-2 w-100 text-start border-0"
          onClick={toggleInputs}
          aria-expanded={inputsOpen}
          aria-controls="bill-inputs-panel"
          style={{ cursor: "pointer" }}
        >
          <span>Bill inputs</span>
          {!inputsOpen && (
            <span className="inputs-summary flex-grow-1">{collapsedSummary}</span>
          )}
          <span className="ms-auto">
            <FontAwesomeIcon
              icon={inputsOpen ? faCaretUp : faCaretDown}
              style={{ fontSize: 16, color: "var(--accent-ink)" }}
              aria-hidden
            />
          </span>
        </button>
        <Collapse in={inputsOpen}>
          <div id="bill-inputs-panel">
            <Card.Body className="pt-3">
              <Row className="g-2">
                <Col xs={6} sm={3}>
                  <FieldLabel
                    label="Rate year"
                    tip="Approved maxima through 2027. Rates effective June 15 appear on the August bill."
                  />
                  <Form.Select
                    size="sm"
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
                    size="sm"
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
                    tip="Bimonthly usage in hundreds of cubic feet. Also used as a proxy to suggest capital band and drought tier when spring / yearly averages are unknown."
                  />
                  <Form.Control
                    size="sm"
                    type="number"
                    min={0}
                    step={1}
                    value={waterUseCcf}
                    aria-label="Water use ccf"
                    onChange={(e) => setWaterUseCcf(e.target.value)}
                  />
                </Col>
                <Col xs={6} sm={3}>
                  <FieldLabel
                    label="Winter sewer avg"
                    tip="Mid-October → mid-February average. Half-units allowed. Pre-filled 18.5 from sample bills."
                  />
                  <Form.Control
                    size="sm"
                    type="number"
                    min={0}
                    step={0.5}
                    value={winterSewerAvgCcf}
                    aria-label="Winter sewer average ccf"
                    onChange={(e) => setWinterSewerAvgCcf(e.target.value)}
                  />
                </Col>
              </Row>

              <Row className="g-2 mt-2">
                <Col xs={12} sm={6}>
                  <div className="border rounded-3 p-2 h-100">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
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
                            spring-usage bands. Override if your bill differs.
                          </span>
                        }
                      />
                      {(capitalOverride || capitalManual) && (
                        <Badge className="badge-custom" bg="">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-3 mb-2">
                      <Form.Check
                        type="radio"
                        id="capital-band"
                        name="capitalMode"
                        label="Band"
                        checked={!capitalManual}
                        onChange={() => {
                          setCapitalManual(false);
                          setCapitalOverride(true);
                        }}
                      />
                      <Form.Check
                        type="radio"
                        id="capital-manual"
                        name="capitalMode"
                        label="Manual $"
                        checked={capitalManual}
                        onChange={() => {
                          setCapitalManual(true);
                          setCapitalOverride(true);
                          setCapitalManualAmount(String(capitalAmount));
                        }}
                      />
                    </div>
                    {capitalManual ? (
                      <Form.Control
                        size="sm"
                        type="number"
                        min={0}
                        step={0.01}
                        value={capitalManualAmount}
                        aria-label="Capital amount"
                        onChange={(e) => {
                          setCapitalManualAmount(e.target.value);
                          setCapitalOverride(true);
                        }}
                      />
                    ) : (
                      <Form.Select
                        size="sm"
                        value={capitalPresetId}
                        aria-label="Capital band"
                        onChange={(e) => {
                          setCapitalPresetId(e.target.value);
                          setCapitalOverride(true);
                          setCapitalManual(false);
                        }}
                      >
                        {CAPITAL_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                            {p.id === capitalSuggested.id
                              ? " · suggested"
                              : ""}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    {(capitalOverride || capitalManual) && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={resetCapitalSuggested}
                      >
                        <FontAwesomeIcon
                          icon={faRotateLeft}
                          className="me-1"
                          style={{ fontSize: 11 }}
                        />
                        Use suggested ({capitalSuggested.label})
                      </Button>
                    )}
                  </div>
                </Col>

                <Col xs={12} sm={6}>
                  <div className="border rounded-3 p-2 h-100">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <FieldLabel
                        label="Drought contingency"
                        tip={
                          <span>
                            Auto below/above median (12 units) from water-use
                            proxy per City{" "}
                            <a
                              href="https://www.brisbaneca.gov/512/Drought-Contingency-Charge"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Drought Contingency Charge
                            </a>
                            . Override if your bill differs.
                          </span>
                        }
                      />
                      {droughtOverride && (
                        <Badge className="badge-custom" bg="">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <Form.Check
                        type="radio"
                        id="drought-below"
                        name="droughtMode"
                        label={`Below $2.32${
                          droughtSuggested.id === "below" && !droughtOverride
                            ? " · auto"
                            : ""
                        }`}
                        checked={droughtMode === "below"}
                        onChange={() => {
                          setDroughtMode("below");
                          setDroughtOverride(true);
                        }}
                      />
                      <Form.Check
                        type="radio"
                        id="drought-above"
                        name="droughtMode"
                        label={`Above $6.99${
                          droughtSuggested.id === "above" && !droughtOverride
                            ? " · auto"
                            : ""
                        }`}
                        checked={droughtMode === "above"}
                        onChange={() => {
                          setDroughtMode("above");
                          setDroughtOverride(true);
                        }}
                      />
                      <Form.Check
                        type="radio"
                        id="drought-manual"
                        name="droughtMode"
                        label="Manual"
                        checked={droughtMode === "manual"}
                        onChange={() => {
                          setDroughtMode("manual");
                          setDroughtOverride(true);
                        }}
                      />
                    </div>
                    {droughtMode === "manual" && (
                      <Form.Control
                        size="sm"
                        type="number"
                        min={0}
                        step={0.01}
                        value={droughtManual}
                        aria-label="Drought amount"
                        onChange={(e) => {
                          setDroughtManual(e.target.value);
                          setDroughtOverride(true);
                        }}
                      />
                    )}
                    {droughtOverride && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={resetDroughtSuggested}
                      >
                        <FontAwesomeIcon
                          icon={faRotateLeft}
                          className="me-1"
                          style={{ fontSize: 11 }}
                        />
                        Use suggested ({droughtSuggested.label})
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </div>
        </Collapse>
      </Card>

      {/* ESTIMATED BILL */}
      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <span>Estimated bill</span>
          <ButtonGroup size="sm">
            <ToggleButton
              id="view-bill"
              type="radio"
              variant={resultView === "bill" ? "primary" : "outline-primary"}
              name="resultView"
              value="bill"
              checked={resultView === "bill"}
              onChange={() => setResultView("bill")}
            >
              {rateYear} detail
            </ToggleButton>
            <ToggleButton
              id="view-years"
              type="radio"
              variant={resultView === "years" ? "primary" : "outline-primary"}
              name="resultView"
              value="years"
              checked={resultView === "years"}
              onChange={() => setResultView("years")}
            >
              All years
            </ToggleButton>
          </ButtonGroup>
        </Card.Header>

        {resultView === "bill" ? (
          <>
            <div className="amount-due">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-baseline gap-2">
                <div>
                  <div className="amount-due__label">
                    Amount due · {rateYear}
                  </div>
                  <button
                    type="button"
                    className="amount-due__total"
                    aria-expanded={!!expanded.total}
                    onClick={() => toggleLine("total")}
                  >
                    {formatMoney(totalLine.amount)}
                  </button>
                </div>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Click the total or any line for the formula. Prop 218
                      maxima; over-20 uses published table.
                    </Tooltip>
                  }
                >
                  <span className="amount-due__hint">
                    Prop 218 maxima · over-20 published table{" "}
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                      style={{ fontSize: 12 }}
                    />
                  </span>
                </OverlayTrigger>
              </div>
              <Collapse in={!!expanded.total}>
                <p
                  className="mb-0 mt-2"
                  style={{
                    fontFamily: "var(--font-code)",
                    fontSize: "0.78rem",
                    opacity: 0.9,
                  }}
                >
                  {totalLine.formula}
                </p>
              </Collapse>
            </div>
            <Card.Body className="p-2">
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
                        style={{
                          fontSize: 11,
                          color: "var(--ink-faint)",
                          width: 12,
                        }}
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
          </>
        ) : (
          <Card.Body>
            <p className="text-secondary small mb-2">
              Same inputs under approved maxima through 2027. Capital & drought
              held at current selection.
            </p>
            <div style={{ height: 260, width: "100%" }}>
              <LineChart
                dataset={chartDataset}
                xAxis={[
                  {
                    dataKey: "year",
                    scaleType: "band",
                    categoryGapRatio: 0,
                    tickPlacement: "middle",
                    tickLabelInterval: () => false,
                    disableTicks: true,
                  },
                ]}
                yAxis={[
                  {
                    width: 56,
                    tickLabelStyle: { fontSize: 11, fill: "#555555" },
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
                    dataKey: "total",
                    label: "Total",
                    color: "#111111",
                    curve: "linear",
                    showMark: true,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                  {
                    dataKey: "water",
                    label: "Water (use+svc)",
                    color: "#c2336f",
                    curve: "linear",
                    showMark: true,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                  {
                    dataKey: "sewer",
                    label: "Sewer",
                    color: "#8c8c8c",
                    curve: "linear",
                    showMark: true,
                    valueFormatter: (v) =>
                      v == null ? "" : formatMoney(Number(v)),
                  },
                ]}
                margin={{
                  left: LABEL_COL_PX,
                  right: 0,
                  top: 36,
                  bottom: 8,
                }}
                grid={{ horizontal: true }}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "top", horizontal: "center" },
                  },
                }}
                sx={{
                  "& .MuiChartsAxis-directionX .MuiChartsAxis-tickLabel": {
                    display: "none",
                  },
                }}
              />
            </div>

            <div className="table-responsive mt-1">
              <Table size="sm" className="table-years mb-1">
                <colgroup>
                  <col style={{ width: LABEL_COL_PX }} />
                  {chartYearLabels.map((y) => (
                    <col key={y} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th>Line item</th>
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
                    <tr key={row.id}>
                      <th
                        scope="row"
                        style={{
                          fontWeight: row.emphasize ? 700 : 600,
                          color: row.emphasize
                            ? "var(--ink)"
                            : "var(--ink-soft)",
                          fontFamily: "var(--font-display)",
                        }}
                      >
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
                            style={{
                              fontWeight: row.emphasize ? 700 : 500,
                            }}
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
            <p className="small text-secondary mb-0">
              * 2027 is the last City-approved maximum schedule. Year labels
              appear once in the table header; chart points are centered above
              each year column.
            </p>
          </Card.Body>
        )}
      </Card>

      {/* DISCLAIMER */}
      <Card className="disclaimer-card">
        <Card.Body>
          <h2
            className="h6 mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--accent-ink)",
              fontWeight: 700,
            }}
          >
            Unofficial explainer
          </h2>
          <p className="small text-secondary mb-2">
            This is <strong>not</strong> an official City of Brisbane tool. It
            estimates residential water/sewer bills from published rate tables
            and Prop 218 maximums. Capital and drought auto-suggestions use your
            entered water use as a proxy (City capital bands are spring usage;
            drought uses a yearly average vs median 12) — override when your
            bill differs. Does not include LIRA, AB 3030 pass-throughs, late
            fees, or prior balances. Always trust your actual bill.
          </p>
          <p
            className="small mb-1"
            style={{ fontWeight: 700, color: "var(--ink)" }}
          >
            Sources
          </p>
          <ul className="small mb-0 ps-3">
            {SOURCE_LINKS.map((s) => (
              <li key={s.href} className="mb-1">
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
}
