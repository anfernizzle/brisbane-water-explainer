"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
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
    <Tooltip title={title} placement="top">
      <IconButton
        size="small"
        aria-label="More information"
        sx={{
          p: 0.25,
          ml: 0.25,
          color: "text.secondary",
          "&:hover": { color: "primary.main" },
        }}
      >
        <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: 13 }} />
      </IconButton>
    </Tooltip>
  );
}

function FieldLabel({ label, tip }: { label: string; tip: ReactNode }) {
  return (
    <Stack direction="row" sx={{ mb: 0.35, alignItems: "center" }}>
      <Typography
        component="span"
        variant="caption"
        sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <InfoTip title={tip} />
    </Stack>
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
  const inputsAnchorRef = useRef<HTMLDivElement | null>(null);

  const usageNum = Number(waterUseCcf) || 0;
  const capitalSuggested = useMemo(
    () => suggestCapitalBand(usageNum),
    [usageNum],
  );
  const droughtSuggested = useMemo(
    () => suggestDroughtTier(usageNum),
    [usageNum],
  );

  // Keep auto selection in sync until the user overrides.
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

  // Dataset keeps categories and series values aligned for MUI X Charts.
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

  return (
    <Stack spacing={1.5} className="calculator">
      {/* INPUTS */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          overflow: "hidden",
        }}
      >
        <Box
          ref={inputsAnchorRef}
          component="button"
          type="button"
          onClick={toggleInputs}
          aria-expanded={inputsOpen}
          aria-controls="bill-inputs-panel"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            px: 1.25,
            py: 0.75,
            border: 0,
            cursor: "pointer",
            textAlign: "left",
            font: "inherit",
            color: "inherit",
            bgcolor: "#e8f1f2",
            borderBottom: inputsOpen ? "1px solid" : "none",
            borderColor: "divider",
            "&:hover": { bgcolor: "#deebed" },
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              flex: "0 0 auto",
              color: "primary.dark",
            }}
          >
            Bill inputs
          </Typography>
          {!inputsOpen && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {collapsedSummary}
            </Typography>
          )}
          <Box sx={{ flex: inputsOpen ? 1 : 0 }} />
          <FontAwesomeIcon
            icon={inputsOpen ? faCaretUp : faCaretDown}
            style={{ fontSize: 16, color: "#0a5c63" }}
            aria-hidden
          />
        </Box>

        <Collapse in={inputsOpen} timeout="auto">
          <Box
            id="bill-inputs-panel"
            sx={{ px: 1.25, py: 1.1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  sm: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              <Box>
                <FieldLabel
                  label="Rate year"
                  tip="Approved maxima through 2027. Rates effective June 15 appear on the August bill."
                />
                <FormControl fullWidth>
                  <Select
                    value={rateYear}
                    onChange={(e) =>
                      setRateYear(Number(e.target.value) as RateYear)
                    }
                    inputProps={{ "aria-label": "Rate year" }}
                  >
                    {RATE_YEARS.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y} (eff. {RATE_YEAR_EFFECTIVE[y]})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FieldLabel
                  label="Meter size"
                  tip='5/8" and 3/4" share the same fixed water service rate.'
                />
                <FormControl fullWidth>
                  <Select
                    value={meterSize}
                    onChange={(e) =>
                      setMeterSize(e.target.value as MeterSize)
                    }
                    inputProps={{ "aria-label": "Meter size" }}
                  >
                    {METER_SIZES.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FieldLabel
                  label="Water use (ccf)"
                  tip="Bimonthly usage in hundreds of cubic feet. Also used as a proxy to suggest capital band and drought tier when spring / yearly averages are unknown."
                />
                <TextField
                  fullWidth
                  type="number"
                  value={waterUseCcf}
                  onChange={(e) => setWaterUseCcf(e.target.value)}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 1,
                      "aria-label": "Water use ccf",
                    },
                  }}
                />
              </Box>

              <Box>
                <FieldLabel
                  label="Winter sewer avg"
                  tip="Mid-October → mid-February average. Half-units allowed. Pre-filled 18.5 from sample bills."
                />
                <TextField
                  fullWidth
                  type="number"
                  value={winterSewerAvgCcf}
                  onChange={(e) => setWinterSewerAvgCcf(e.target.value)}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 0.5,
                      "aria-label": "Winter sewer average ccf",
                    },
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 1,
                mt: 1,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              {/* CAPITAL */}
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1,
                  py: 0.75,
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ mb: 0.35, alignItems: "center", flexWrap: "wrap" }}
                >
                  <FieldLabel
                    label="Capital project charge"
                    tip={
                      <span>
                        Auto from entered water use as a proxy for the City{" "}
                        <Link
                          href="https://www.brisbaneca.gov/513/Capital-Projects-Charge"
                          target="_blank"
                          rel="noopener noreferrer"
                          color="inherit"
                        >
                          Capital Projects Charge
                        </Link>{" "}
                        spring-usage bands (mid-Feb – mid-Jun). Override if your
                        bill differs.
                      </span>
                    }
                  />
                  {(capitalOverride || capitalManual) && (
                    <Chip
                      size="small"
                      label="Custom"
                      color="warning"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  )}
                </Stack>
                <RadioGroup
                  row
                  value={capitalManual ? "manual" : "band"}
                  onChange={(_, v) => {
                    if (v === "manual") {
                      setCapitalManual(true);
                      setCapitalOverride(true);
                      setCapitalManualAmount(String(capitalAmount));
                    } else {
                      setCapitalManual(false);
                      setCapitalOverride(true);
                    }
                  }}
                  sx={{ mb: 0.5, gap: 0.5 }}
                >
                  <FormControlLabel
                    value="band"
                    control={<Radio size="small" />}
                    label={<Typography variant="caption">Band</Typography>}
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="manual"
                    control={<Radio size="small" />}
                    label={<Typography variant="caption">Manual $</Typography>}
                  />
                </RadioGroup>
                {capitalManual ? (
                  <TextField
                    fullWidth
                    type="number"
                    value={capitalManualAmount}
                    onChange={(e) => {
                      setCapitalManualAmount(e.target.value);
                      setCapitalOverride(true);
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      },
                      htmlInput: {
                        min: 0,
                        step: 0.01,
                        "aria-label": "Capital amount",
                      },
                    }}
                  />
                ) : (
                  <FormControl fullWidth>
                    <Select
                      value={capitalPresetId}
                      onChange={(e) => {
                        setCapitalPresetId(e.target.value);
                        setCapitalOverride(true);
                        setCapitalManual(false);
                      }}
                      inputProps={{ "aria-label": "Capital band" }}
                    >
                      {CAPITAL_PRESETS.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.label}
                          {p.id === capitalSuggested.id ? " · suggested" : ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {(capitalOverride || capitalManual) && (
                  <Button
                    size="small"
                    startIcon={
                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        style={{ fontSize: 11 }}
                      />
                    }
                    onClick={resetCapitalSuggested}
                    sx={{ mt: 0.5, px: 0.5, minWidth: 0 }}
                  >
                    Use suggested ({capitalSuggested.label})
                  </Button>
                )}
              </Box>

              {/* DROUGHT */}
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1,
                  py: 0.75,
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ mb: 0.35, alignItems: "center", flexWrap: "wrap" }}
                >
                  <FieldLabel
                    label="Drought contingency"
                    tip={
                      <span>
                        Auto below/above median (12 units) from water-use proxy
                        per City{" "}
                        <Link
                          href="https://www.brisbaneca.gov/512/Drought-Contingency-Charge"
                          target="_blank"
                          rel="noopener noreferrer"
                          color="inherit"
                        >
                          Drought Contingency Charge
                        </Link>
                        . Override if your bill differs.
                      </span>
                    }
                  />
                  {droughtOverride && (
                    <Chip
                      size="small"
                      label="Custom"
                      color="warning"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  )}
                </Stack>
                <RadioGroup
                  row
                  value={droughtMode}
                  onChange={(_, v) => {
                    setDroughtMode(v as DroughtMode);
                    setDroughtOverride(true);
                  }}
                  sx={{ mb: droughtMode === "manual" ? 0.5 : 0, gap: 0.25 }}
                >
                  <FormControlLabel
                    value="below"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="caption">
                        Below $2.32
                        {droughtSuggested.id === "below" && !droughtOverride
                          ? " · auto"
                          : ""}
                      </Typography>
                    }
                    sx={{ mr: 0.75 }}
                  />
                  <FormControlLabel
                    value="above"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="caption">
                        Above $6.99
                        {droughtSuggested.id === "above" && !droughtOverride
                          ? " · auto"
                          : ""}
                      </Typography>
                    }
                    sx={{ mr: 0.75 }}
                  />
                  <FormControlLabel
                    value="manual"
                    control={<Radio size="small" />}
                    label={<Typography variant="caption">Manual</Typography>}
                  />
                </RadioGroup>
                {droughtMode === "manual" && (
                  <TextField
                    fullWidth
                    type="number"
                    value={droughtManual}
                    onChange={(e) => {
                      setDroughtManual(e.target.value);
                      setDroughtOverride(true);
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      },
                      htmlInput: {
                        min: 0,
                        step: 0.01,
                        "aria-label": "Drought amount",
                      },
                    }}
                  />
                )}
                {droughtOverride && (
                  <Button
                    size="small"
                    startIcon={
                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        style={{ fontSize: 11 }}
                      />
                    }
                    onClick={resetDroughtSuggested}
                    sx={{ mt: 0.5, px: 0.5, minWidth: 0 }}
                  >
                    Use suggested ({droughtSuggested.label})
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* COMBINED RESULTS CARD */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          // Do not clip chart axis tick labels
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 1.25,
            py: 0.85,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexWrap: "wrap",
            bgcolor: "#e8f1f2",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "primary.dark" }}
          >
            Estimated bill
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={resultView}
            onChange={(_, v: ResultView | null) => {
              if (v) setResultView(v);
            }}
            aria-label="Bill view"
          >
            <ToggleButton value="bill">{rateYear} detail</ToggleButton>
            <ToggleButton value="years">All years</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {resultView === "bill" ? (
          <>
            <Box
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: 1.75,
                color: "primary.contrastText",
                backgroundImage:
                  "linear-gradient(135deg, #0a5c63 0%, #0d6e76 55%, #155e63 100%)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={0.5}
                sx={{
                  alignItems: { xs: "flex-start", sm: "baseline" },
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ opacity: 0.85, letterSpacing: "0.1em" }}
                  >
                    Amount due · {rateYear}
                  </Typography>
                  <Typography
                    component="button"
                    type="button"
                    onClick={() => toggleLine("total")}
                    aria-expanded={!!expanded.total}
                    sx={{
                      display: "block",
                      m: 0,
                      p: 0,
                      border: 0,
                      background: "none",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontWeight: 600,
                      fontSize: { xs: "2.35rem", sm: "2.85rem" },
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatMoney(totalLine.amount)}
                  </Typography>
                </Box>
                <Tooltip title="Click the total or any line for the formula. Prop 218 maxima; over-20 uses published table.">
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.85, maxWidth: 240 }}
                  >
                    Prop 218 maxima · over-20 published table
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                      style={{ marginLeft: 6, fontSize: 12 }}
                    />
                  </Typography>
                </Tooltip>
              </Stack>
              <Collapse in={!!expanded.total}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    opacity: 0.9,
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                  }}
                >
                  {totalLine.formula}
                </Typography>
              </Collapse>
            </Box>

            <Box sx={{ px: 0.5, py: 0.5 }}>
              {lineItems.map((line) => {
                const isOpen = !!expanded[line.id];
                return (
                  <Box key={line.id}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => toggleLine(line.id)}
                      aria-expanded={isOpen}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: 1,
                        alignItems: "center",
                        width: "100%",
                        border: 0,
                        borderRadius: 1,
                        bgcolor: "transparent",
                        px: 1.25,
                        py: 0.85,
                        cursor: "pointer",
                        textAlign: "left",
                        font: "inherit",
                        color: "inherit",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <FontAwesomeIcon
                        icon={isOpen ? faChevronDown : faChevronRight}
                        style={{ fontSize: 11, color: "#5a656c", width: 12 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          letterSpacing: "0.02em",
                          fontSize: "0.84rem",
                          color: "text.secondary",
                        }}
                      >
                        {line.label}
                      </Typography>
                      <Typography
                        className="money"
                        sx={{ fontWeight: 600, fontSize: "0.98rem" }}
                      >
                        {formatMoney(line.amount)}
                      </Typography>
                    </Box>
                    <Collapse in={isOpen}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        className="money"
                        sx={{ display: "block", px: 4, pb: 1, lineHeight: 1.45 }}
                      >
                        {line.formula}
                      </Typography>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          </>
        ) : (
          <Box sx={{ p: 1.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Same inputs under approved maxima through 2027. Capital & drought
              held at current selection.
            </Typography>

            {(() => {
              // Shared geometry: left gutter (Y-axis + row labels) + 5 equal year columns.
              const LABEL_COL_PX = 120;
              const gridColumns = `${LABEL_COL_PX}px repeat(5, minmax(0, 1fr))`;

              return (
                <Box>
                  {/* Chart plot shares the same left gutter / column widths as the table */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: gridColumns,
                      width: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        gridColumn: "1 / -1",
                        height: 260,
                        width: "100%",
                      }}
                    >
                      <LineChart
                        dataset={chartDataset}
                        xAxis={[
                          {
                            dataKey: "year",
                            scaleType: "band",
                            // Center marks in each year column (matches table cells).
                            categoryGapRatio: 0,
                            tickPlacement: "middle",
                            // Hide X tick labels — years live only in the table header.
                            tickLabelInterval: () => false,
                            disableTicks: true,
                          },
                        ]}
                        yAxis={[
                          {
                            width: 56,
                            tickLabelStyle: {
                              fontSize: 11,
                              fill: "#5a656c",
                            },
                            valueFormatter: (value: number | null) => {
                              if (
                                value == null ||
                                Number.isNaN(Number(value))
                              ) {
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
                            color: "#0a5c63",
                            curve: "linear",
                            showMark: true,
                            valueFormatter: (v) =>
                              v == null ? "" : formatMoney(Number(v)),
                          },
                          {
                            dataKey: "water",
                            label: "Water (use+svc)",
                            color: "#2f6fed",
                            curve: "linear",
                            showMark: true,
                            valueFormatter: (v) =>
                              v == null ? "" : formatMoney(Number(v)),
                          },
                          {
                            dataKey: "sewer",
                            label: "Sewer",
                            color: "#c45c26",
                            curve: "linear",
                            showMark: true,
                            valueFormatter: (v) =>
                              v == null ? "" : formatMoney(Number(v)),
                          },
                        ]}
                        // Left margin = label column so the plot spans the 5 year columns.
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
                            position: {
                              vertical: "top",
                              horizontal: "center",
                            },
                          },
                        }}
                        sx={{
                          // Belt-and-suspenders: never paint X tick labels.
                          "& .MuiChartsAxis-directionX .MuiChartsAxis-tickLabel":
                            {
                              display: "none",
                            },
                          "& .MuiChartsAxis-directionX .MuiChartsAxis-line": {
                            stroke: "#d0d7db",
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Single year-label row = table header; columns match chart plot */}
                  <TableContainer sx={{ mt: 0.25 }}>
                    <Table
                      size="small"
                      sx={{
                        tableLayout: "fixed",
                        width: "100%",
                      }}
                    >
                      <colgroup>
                        <col style={{ width: LABEL_COL_PX }} />
                        {chartYearLabels.map((y) => (
                          <col key={y} />
                        ))}
                      </colgroup>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              color: "primary.dark",
                              fontFamily:
                                "var(--font-outfit), Outfit, sans-serif",
                              width: LABEL_COL_PX,
                            }}
                          >
                            Line item
                          </TableCell>
                          {chartYearLabels.map((y) => (
                            <TableCell
                              key={y}
                              align="center"
                              sx={{
                                fontWeight: 700,
                                color:
                                  Number(y) === rateYear
                                    ? "primary.main"
                                    : "text.primary",
                                bgcolor:
                                  Number(y) === rateYear
                                    ? "rgba(10, 92, 99, 0.08)"
                                    : undefined,
                              }}
                            >
                              {y}
                              {y === "2027" ? " *" : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell
                              component="th"
                              scope="row"
                              sx={{
                                fontWeight: row.emphasize ? 700 : 600,
                                fontFamily:
                                  "var(--font-outfit), Outfit, sans-serif",
                                color: row.emphasize
                                  ? "text.primary"
                                  : "text.secondary",
                                width: LABEL_COL_PX,
                              }}
                            >
                              {row.label}
                            </TableCell>
                            {row.values.map((value, idx) => {
                              const y = Number(chartYearLabels[idx]);
                              return (
                                <TableCell
                                  key={`${row.id}-${y}`}
                                  align="center"
                                  sx={{
                                    fontFamily:
                                      "var(--font-ibm-plex-mono), monospace",
                                    fontSize: "0.82rem",
                                    fontWeight: row.emphasize ? 700 : 500,
                                    bgcolor:
                                      y === rateYear
                                        ? "rgba(10, 92, 99, 0.08)"
                                        : undefined,
                                  }}
                                >
                                  {formatMoney(value)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.75, display: "block" }}
                  >
                    * 2027 is the last City-approved maximum schedule. Year
                    labels appear once in the table header; chart points are
                    centered above each year column.
                  </Typography>
                </Box>
              );
            })()}
          </Box>
        )}
      </Paper>

      {/* DISCLAIMER */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "warning.main",
          bgcolor: "warning.light",
          borderRadius: 1.5,
          p: 1.5,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 0.5, color: "primary.dark" }}
        >
          Unofficial explainer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          This is <strong>not</strong> an official City of Brisbane tool. It
          estimates residential water/sewer bills from published rate tables and
          Prop 218 maximums. Capital and drought auto-suggestions use your
          entered water use as a proxy (City capital bands are spring usage;
          drought uses a yearly average vs median 12) — override when your bill
          differs. Does not include LIRA, AB 3030 pass-throughs, late fees, or
          prior balances. Always trust your actual bill.
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, display: "block", mb: 0.35 }}
        >
          Sources
        </Typography>
        <Box
          component="ul"
          sx={{ m: 0, pl: 2.2, "& li": { mb: 0.25, fontSize: "0.85rem" } }}
        >
          {SOURCE_LINKS.map((s) => (
            <li key={s.href}>
              <Link href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
              </Link>
            </li>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}
