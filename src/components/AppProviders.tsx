"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0a5c63",
      dark: "#074248",
      light: "#1a7a82",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#3d4a52",
    },
    background: {
      default: "#f3f5f4",
      paper: "#ffffff",
    },
    text: {
      primary: "#182024",
      secondary: "#5a656c",
    },
    divider: "#d0d7db",
    warning: {
      main: "#b8860b",
      light: "#fff8e8",
    },
  },
  typography: {
    fontFamily: "var(--font-figtree), Figtree, sans-serif",
    h1: {
      fontFamily: "var(--font-figtree), Figtree, sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 650,
      letterSpacing: "-0.015em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    overline: {
      letterSpacing: "0.08em",
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterTouchDelay: 0,
      },
      styleOverrides: {
        tooltip: {
          fontSize: "0.8rem",
          lineHeight: 1.4,
          maxWidth: 280,
          backgroundColor: "#243038",
        },
        arrow: {
          color: "#243038",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
