"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

/** Minimal MUI theme — only for @mui/x-charts. Chrome/forms use Bootstrap. */
const chartTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1a73e8" },
    text: { primary: "#111111", secondary: "#555555" },
    divider: "rgba(17,17,17,0.22)",
  },
  typography: {
    fontFamily: "var(--font-google-sans), 'Google Sans', sans-serif",
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={chartTheme}>{children}</ThemeProvider>;
}
