"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Box,
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
  Tooltip,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faCircleInfo,
  faCompress,
  faExpand,
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

type CapitalMode = "preset" | "manual";
type DroughtMode = "below" | "above" | "manual";

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

function FieldLabel({
  label,
  tip,
}: {
  label: string;
  tip: ReactNode;
}) {
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

  const [capitalMode, setCapitalMode] = useState<CapitalMode>("preset");
  const [capitalPresetId, setCapitalPresetId] = useState("11-19");
  const [capitalManual, setCapitalManual] = useState(
    String(DEFAULT_INPUTS.capitalAmount),
  );

  const [droughtMode, setDroughtMode] = useState<DroughtMode>("above");
  const [droughtManual, setDroughtManual] = useState(
    String(DEFAULT_INPUTS.droughtAmount),
  );

  const [inputsOpen, setInputsOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const inputsAnchorRef = useRef<HTMLDivElement | null>(null);
  const userToggledRef = useRef(false);

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

  const lineItems = result.lines.filter((l) => l.id !== "total");
  const totalLine = result.lines.find((l) => l.id === "total")!;

  // Auto-collapse when the inputs block scrolls out of view (user appears done).
  useEffect(() => {
    const el = inputsAnchorRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        // Only auto-collapse when scrolling away; don't fight a manual expand.
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setInputsOpen((open) => {
            if (open && !userToggledRef.current) return false;
            if (open) {
              // Even after a manual expand, collapsing on scroll-away is desired.
              return false;
            }
            return open;
          });
          userToggledRef.current = false;
        }
      },
      { threshold: 0, rootMargin: "-8% 0px 0px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function toggleInputs() {
    userToggledRef.current = true;
    setInputsOpen((v) => !v);
  }

  function toggleLine(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const collapsedSummary = `${rateYear} · ${meterSize} · ${waterUseCcf || 0} ccf · winter ${winterSewerAvgCcf || 0} · capital ${formatMoney(capitalAmount)} · drought ${formatMoney(droughtAmount)}`;

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
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.75,
            bgcolor: inputsOpen ? "background.paper" : "action.hover",
            borderBottom: inputsOpen ? "1px solid" : "none",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, flex: "0 0 auto" }}
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
          <Tooltip title={inputsOpen ? "Collapse inputs" : "Expand inputs"}>
            <IconButton
              size="small"
              onClick={toggleInputs}
              aria-expanded={inputsOpen}
              aria-controls="bill-inputs-panel"
              aria-label={inputsOpen ? "Collapse inputs" : "Expand inputs"}
            >
              <FontAwesomeIcon
                icon={inputsOpen ? faCompress : faExpand}
                style={{ fontSize: 14 }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={inputsOpen} timeout="auto">
          <Box id="bill-inputs-panel" sx={{ px: 1.25, py: 1.1 }}>
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
                  tip='5/8" and 3/4" share the same fixed water service rate. Larger meters cost more.'
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
                  tip="Bimonthly usage in hundreds of cubic feet (ccf)."
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
                  tip="Mid-October → mid-February average. Half-units allowed. Pre-filled 18.5 from sample bills — edit if yours differs."
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
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1,
                  py: 0.75,
                }}
              >
                <FieldLabel
                  label="Capital project charge"
                  tip={
                    <span>
                      From the City{" "}
                      <Link
                        href="https://www.brisbaneca.gov/513/Capital-Projects-Charge"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                      >
                        Capital Projects Charge
                      </Link>{" "}
                      page: graduated by springtime usage (mid-Feb – mid-Jun),
                      per 2-month cycle (2022 rates). Multi-period banding is
                      not fully specified — use your bill or a band preset.
                    </span>
                  }
                />
                <RadioGroup
                  row
                  value={capitalMode}
                  onChange={(_, v) => setCapitalMode(v as CapitalMode)}
                  sx={{ mb: 0.5, gap: 0.5 }}
                >
                  <FormControlLabel
                    value="preset"
                    control={<Radio size="small" />}
                    label={<Typography variant="caption">Band</Typography>}
                    sx={{ mr: 1 }}
                  />
                  <FormControlLabel
                    value="manual"
                    control={<Radio size="small" />}
                    label={<Typography variant="caption">Manual</Typography>}
                  />
                </RadioGroup>
                {capitalMode === "preset" ? (
                  <FormControl fullWidth>
                    <Select
                      value={capitalPresetId}
                      onChange={(e) => setCapitalPresetId(e.target.value)}
                      inputProps={{ "aria-label": "Capital band preset" }}
                    >
                      {CAPITAL_PRESETS.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    type="number"
                    value={capitalManual}
                    onChange={(e) => setCapitalManual(e.target.value)}
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
                )}
              </Box>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1,
                  py: 0.75,
                }}
              >
                <FieldLabel
                  label="Drought contingency"
                  tip={
                    <span>
                      From the City{" "}
                      <Link
                        href="https://www.brisbaneca.gov/512/Drought-Contingency-Charge"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                      >
                        Drought Contingency Charge
                      </Link>{" "}
                      page: $2.32 / $6.99 per billing when yearly average is
                      below / above the median (currently 12 units). Exact
                      average window is unpublished.
                    </span>
                  }
                />
                <RadioGroup
                  row
                  value={droughtMode}
                  onChange={(_, v) => setDroughtMode(v as DroughtMode)}
                  sx={{ mb: droughtMode === "manual" ? 0.5 : 0, gap: 0.25 }}
                >
                  <FormControlLabel
                    value="below"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="caption">Below $2.32</Typography>
                    }
                    sx={{ mr: 0.75 }}
                  />
                  <FormControlLabel
                    value="above"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="caption">Above $6.99</Typography>
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
                    onChange={(e) => setDroughtManual(e.target.value)}
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
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* ESTIMATED BILL */}
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
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.75,
            bgcolor: "primary.main",
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
                Amount due
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
            <Tooltip title="Click the total or any line for the formula">
              <Typography
                variant="caption"
                sx={{ opacity: 0.85, maxWidth: 220 }}
              >
                Prop 218 maxima · over-20 uses published table
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
                    sx={{
                      display: "block",
                      px: 4,
                      pb: 1,
                      lineHeight: 1.45,
                    }}
                  >
                    {line.formula}
                  </Typography>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* YEAR COMPARISON */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
          p: 1.5,
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ mb: 0.75, alignItems: "center" }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Same inputs under approved years
          </Typography>
          <InfoTip title="Capital and drought held constant (manual/presets). Water and sewer use each year’s approved maxima through 2027." />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Year</TableCell>
                <TableCell align="right">Water use</TableCell>
                <TableCell align="right">Water svc</TableCell>
                <TableCell align="right">Sewer</TableCell>
                <TableCell align="right">Capital</TableCell>
                <TableCell align="right">Drought</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projections.map(({ rateYear: y, result: r }) => (
                <TableRow
                  key={y}
                  selected={y === rateYear}
                  sx={{
                    "& td, & th": { fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: "0.82rem" },
                    "&.Mui-selected": { bgcolor: "rgba(10, 92, 99, 0.08)" },
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600, fontFamily: "var(--font-figtree), sans-serif !important" }}>
                    {y}
                    {y === 2027 ? " *" : ""}
                  </TableCell>
                  <TableCell align="right">{formatMoney(r.waterUse)}</TableCell>
                  <TableCell align="right">{formatMoney(r.waterService)}</TableCell>
                  <TableCell align="right">{formatMoney(r.sewer)}</TableCell>
                  <TableCell align="right">{formatMoney(r.capital)}</TableCell>
                  <TableCell align="right">{formatMoney(r.drought)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatMoney(r.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
          * 2027 is the last City-approved maximum schedule.
        </Typography>
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
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Unofficial explainer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          This is <strong>not</strong> an official City of Brisbane tool. It
          estimates residential water/sewer bills from published rate tables and
          Prop 218 maximums. It does not include LIRA (25% discount for CARE
          enrollees), AB 3030 pass-throughs, late fees, or prior balances. Always
          trust your actual bill.
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.35 }}>
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
