"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import type { ThemeColor, BackgroundColor } from "@/lib/models/types";

// Color mapping for OKLCH values - Tailwind colors converted to OKLCH
const themeColorMap: Record<
  ThemeColor,
  {
    primary: string;
    ring: string;
  }
> = {
  zinc: {
    primary: "0.55 0.015 255",
    ring: "0.55 0.015 255",
  },
  slate: {
    primary: "0.60 0.032 235",
    ring: "0.60 0.032 235",
  },
  stone: {
    primary: "0.58 0.012 60",
    ring: "0.58 0.012 60",
  },
  gray: {
    primary: "0.59 0.018 235",
    ring: "0.59 0.018 235",
  },
  neutral: {
    primary: "0.58 0 0",
    ring: "0.58 0 0",
  },
  red: {
    primary: "0.64 0.22 25",
    ring: "0.64 0.22 25",
  },
  orange: {
    primary: "0.75 0.18 55",
    ring: "0.75 0.18 55",
  },
  amber: {
    primary: "0.80 0.17 75",
    ring: "0.80 0.17 75",
  },
  yellow: {
    primary: "0.85 0.18 95",
    ring: "0.85 0.18 95",
  },
  lime: {
    primary: "0.85 0.19 125",
    ring: "0.85 0.19 125",
  },
  green: {
    primary: "0.60 0.17 145",
    ring: "0.60 0.17 145",
  },
  emerald: {
    primary: "0.65 0.18 165",
    ring: "0.65 0.18 165",
  },
  teal: {
    primary: "0.65 0.16 180",
    ring: "0.65 0.16 180",
  },
  cyan: {
    primary: "0.75 0.14 195",
    ring: "0.75 0.14 195",
  },
  sky: {
    primary: "0.75 0.14 215",
    ring: "0.75 0.14 215",
  },
  blue: {
    primary: "0.68 0.18 240",
    ring: "0.68 0.18 240",
  },
  indigo: {
    primary: "0.72 0.17 265",
    ring: "0.72 0.17 265",
  },
  violet: {
    primary: "0.75 0.19 285",
    ring: "0.75 0.19 285",
  },
  purple: {
    primary: "0.70 0.20 295",
    ring: "0.70 0.20 295",
  },
  fuchsia: {
    primary: "0.75 0.22 310",
    ring: "0.75 0.22 310",
  },
  pink: {
    primary: "0.72 0.18 345",
    ring: "0.72 0.18 345",
  },
  rose: {
    primary: "0.68 0.18 10",
    ring: "0.68 0.18 10",
  },
};

// Background color mapping for OKLCH values
const backgroundColorMap: Record<
  BackgroundColor,
  {
    bg: string;
    fg: string;
    card: string;
    neoShadowLight: string;
    neoShadowDark: string;
    neoInsetLight: string;
    neoInsetDark: string;
    glassBg: string;
    glassBorder: string;
    border: string;
    input: string;
    secondary: string;
    accent: string;
    hoverBg: string;
    hoverGlass: string;
    hoverGlassBorder: string;
  }
> = {
  black: {
    bg: "0.15 0.01 250",
    fg: "0.985 0 0",
    card: "0.18 0.008 250",
    neoShadowLight: "0.35 0.015 250 / 0.8",
    neoShadowDark: "0.08 0.005 250 / 0.9",
    neoInsetLight: "0.35 0.015 250 / 0.5",
    neoInsetDark: "0.08 0.005 250 / 0.7",
    glassBg: "0.2 0.008 250 / 0.4",
    glassBorder: "0.4 0.01 250 / 0.2",
    border: "0.25 0.008 250",
    input: "0.22 0.008 250",
    secondary: "0.25 0.01 250",
    accent: "0.28 0.02 250",
    hoverBg: "0.22 0.012 250",
    hoverGlass: "0.25 0.012 250 / 0.5",
    hoverGlassBorder: "0.5 0.02 250 / 0.3",
  },
  dark: {
    bg: "0.18 0.008 250",
    fg: "0.985 0 0",
    card: "0.22 0.01 250",
    neoShadowLight: "0.38 0.015 250 / 0.8",
    neoShadowDark: "0.10 0.005 250 / 0.9",
    neoInsetLight: "0.38 0.015 250 / 0.5",
    neoInsetDark: "0.10 0.005 250 / 0.7",
    glassBg: "0.23 0.008 250 / 0.4",
    glassBorder: "0.43 0.01 250 / 0.2",
    border: "0.28 0.008 250",
    input: "0.25 0.008 250",
    secondary: "0.28 0.01 250",
    accent: "0.31 0.02 250",
    hoverBg: "0.25 0.012 250",
    hoverGlass: "0.28 0.012 250 / 0.5",
    hoverGlassBorder: "0.53 0.02 250 / 0.3",
  },
  darker: {
    bg: "0.12 0.01 250",
    fg: "0.985 0 0",
    card: "0.15 0.01 250",
    neoShadowLight: "0.30 0.015 250 / 0.8",
    neoShadowDark: "0.05 0.005 250 / 0.9",
    neoInsetLight: "0.30 0.015 250 / 0.5",
    neoInsetDark: "0.05 0.005 250 / 0.7",
    glassBg: "0.17 0.008 250 / 0.4",
    glassBorder: "0.37 0.01 250 / 0.2",
    border: "0.22 0.008 250",
    input: "0.19 0.008 250",
    secondary: "0.22 0.01 250",
    accent: "0.25 0.02 250",
    hoverBg: "0.19 0.012 250",
    hoverGlass: "0.22 0.012 250 / 0.5",
    hoverGlassBorder: "0.47 0.02 250 / 0.3",
  },
  darkest: {
    bg: "0.08 0.005 250",
    fg: "0.985 0 0",
    card: "0.12 0.008 250",
    neoShadowLight: "0.25 0.015 250 / 0.8",
    neoShadowDark: "0.02 0.005 250 / 0.9",
    neoInsetLight: "0.25 0.015 250 / 0.5",
    neoInsetDark: "0.02 0.005 250 / 0.7",
    glassBg: "0.13 0.008 250 / 0.4",
    glassBorder: "0.33 0.01 250 / 0.2",
    border: "0.18 0.008 250",
    input: "0.15 0.008 250",
    secondary: "0.18 0.01 250",
    accent: "0.21 0.02 250",
    hoverBg: "0.15 0.012 250",
    hoverGlass: "0.18 0.012 250 / 0.5",
    hoverGlassBorder: "0.43 0.02 250 / 0.3",
  },
  zinc: {
    bg: "0.16 0.015 255",
    fg: "0.985 0 0",
    card: "0.20 0.015 255",
    neoShadowLight: "0.36 0.020 255 / 0.8",
    neoShadowDark: "0.08 0.008 255 / 0.9",
    neoInsetLight: "0.36 0.020 255 / 0.5",
    neoInsetDark: "0.08 0.008 255 / 0.7",
    glassBg: "0.21 0.015 255 / 0.4",
    glassBorder: "0.41 0.015 255 / 0.2",
    border: "0.26 0.015 255",
    input: "0.23 0.015 255",
    secondary: "0.26 0.015 255",
    accent: "0.29 0.018 255",
    hoverBg: "0.23 0.018 255",
    hoverGlass: "0.26 0.018 255 / 0.5",
    hoverGlassBorder: "0.51 0.025 255 / 0.3",
  },
  slate: {
    bg: "0.16 0.020 235",
    fg: "0.985 0 0",
    card: "0.20 0.020 235",
    neoShadowLight: "0.36 0.025 235 / 0.8",
    neoShadowDark: "0.08 0.010 235 / 0.9",
    neoInsetLight: "0.36 0.025 235 / 0.5",
    neoInsetDark: "0.08 0.010 235 / 0.7",
    glassBg: "0.21 0.020 235 / 0.4",
    glassBorder: "0.41 0.020 235 / 0.2",
    border: "0.26 0.020 235",
    input: "0.23 0.020 235",
    secondary: "0.26 0.020 235",
    accent: "0.29 0.022 235",
    hoverBg: "0.23 0.024 235",
    hoverGlass: "0.26 0.024 235 / 0.5",
    hoverGlassBorder: "0.51 0.030 235 / 0.3",
  },
  gray: {
    bg: "0.16 0.018 235",
    fg: "0.985 0 0",
    card: "0.20 0.018 235",
    neoShadowLight: "0.36 0.023 235 / 0.8",
    neoShadowDark: "0.08 0.009 235 / 0.9",
    neoInsetLight: "0.36 0.023 235 / 0.5",
    neoInsetDark: "0.08 0.009 235 / 0.7",
    glassBg: "0.21 0.018 235 / 0.4",
    glassBorder: "0.41 0.018 235 / 0.2",
    border: "0.26 0.018 235",
    input: "0.23 0.018 235",
    secondary: "0.26 0.018 235",
    accent: "0.29 0.020 235",
    hoverBg: "0.23 0.022 235",
    hoverGlass: "0.26 0.022 235 / 0.5",
    hoverGlassBorder: "0.51 0.028 235 / 0.3",
  },
  white: {
    bg: "1.0 0 0",
    fg: "0.15 0 0",
    card: "0.98 0 0",
    neoShadowLight: "0.70 0.005 0 / 0.3",
    neoShadowDark: "0.92 0.003 0 / 0.5",
    neoInsetLight: "0.70 0.005 0 / 0.2",
    neoInsetDark: "0.92 0.003 0 / 0.4",
    glassBg: "0.95 0.002 0 / 0.6",
    glassBorder: "0.80 0.005 0 / 0.3",
    border: "0.88 0.005 0",
    input: "0.95 0.003 0",
    secondary: "0.94 0.003 0",
    accent: "0.92 0.005 0",
    hoverBg: "0.96 0.008 0",
    hoverGlass: "0.92 0.008 0 / 0.7",
    hoverGlassBorder: "0.75 0.010 0 / 0.4",
  },
  milk: {
    bg: "0.98 0.005 80",
    fg: "0.15 0 0",
    card: "0.95 0.008 80",
    neoShadowLight: "0.68 0.008 80 / 0.3",
    neoShadowDark: "0.90 0.005 80 / 0.5",
    neoInsetLight: "0.68 0.008 80 / 0.2",
    neoInsetDark: "0.90 0.005 80 / 0.4",
    glassBg: "0.93 0.006 80 / 0.6",
    glassBorder: "0.78 0.008 80 / 0.3",
    border: "0.86 0.008 80",
    input: "0.93 0.006 80",
    secondary: "0.92 0.006 80",
    accent: "0.90 0.008 80",
    hoverBg: "0.94 0.010 80",
    hoverGlass: "0.90 0.010 80 / 0.7",
    hoverGlassBorder: "0.73 0.012 80 / 0.4",
  },
  "light-gray": {
    bg: "0.94 0.008 235",
    fg: "0.15 0 0",
    card: "0.90 0.010 235",
    neoShadowLight: "0.64 0.010 235 / 0.3",
    neoShadowDark: "0.86 0.008 235 / 0.5",
    neoInsetLight: "0.64 0.010 235 / 0.2",
    neoInsetDark: "0.86 0.008 235 / 0.4",
    glassBg: "0.88 0.009 235 / 0.6",
    glassBorder: "0.73 0.010 235 / 0.3",
    border: "0.82 0.010 235",
    input: "0.88 0.009 235",
    secondary: "0.87 0.009 235",
    accent: "0.85 0.011 235",
    hoverBg: "0.88 0.012 235",
    hoverGlass: "0.85 0.012 235 / 0.7",
    hoverGlassBorder: "0.68 0.014 235 / 0.4",
  },
};

interface AppThemeProviderProps extends ThemeProviderProps {
  initialThemeColor?: ThemeColor;
  initialBackgroundColor?: BackgroundColor;
}

export function ThemeProvider({
  children,
  initialThemeColor = "blue",
  initialBackgroundColor = "black",
  ...props
}: AppThemeProviderProps) {
  const [themeColor, setThemeColor] =
    React.useState<ThemeColor>(initialThemeColor);
  const [backgroundColor, setBackgroundColor] = React.useState<BackgroundColor>(
    initialBackgroundColor,
  );

  // Apply theme color to CSS variables
  React.useEffect(() => {
    const colors = themeColorMap[themeColor];
    if (colors) {
      const root = document.documentElement;
      // Set OKLCH values
      root.style.setProperty("--primary", `oklch(${colors.primary})`);
      root.style.setProperty("--ring", `oklch(${colors.ring})`);
      root.style.setProperty("--sidebar-primary", `oklch(${colors.primary})`);
      root.style.setProperty("--sidebar-ring", `oklch(${colors.ring})`);
    }
  }, [themeColor]);

  // Apply background color to CSS variables
  React.useEffect(() => {
    const colors = backgroundColorMap[backgroundColor];
    if (colors) {
      const root = document.documentElement;

      // Background and foreground
      root.style.setProperty("--background", `oklch(${colors.bg})`);
      root.style.setProperty("--foreground", `oklch(${colors.fg})`);
      root.style.setProperty("--card", `oklch(${colors.card})`);
      root.style.setProperty("--card-foreground", `oklch(${colors.fg})`);
      root.style.setProperty("--popover", `oklch(${colors.card})`);
      root.style.setProperty("--popover-foreground", `oklch(${colors.fg})`);
      root.style.setProperty("--sidebar", `oklch(${colors.card})`);
      root.style.setProperty("--sidebar-foreground", `oklch(${colors.fg})`);
      root.style.setProperty("--muted", `oklch(${colors.card})`);
      root.style.setProperty(
        "--muted-foreground",
        `oklch(${colors.fg === "0.985 0 0" ? "0.65 0 0" : "0.45 0 0"})`,
      );

      // Borders and inputs
      root.style.setProperty("--border", `oklch(${colors.border})`);
      root.style.setProperty("--input", `oklch(${colors.input})`);
      root.style.setProperty("--secondary", `oklch(${colors.secondary})`);
      root.style.setProperty("--secondary-foreground", `oklch(${colors.fg})`);
      root.style.setProperty("--accent", `oklch(${colors.accent})`);
      root.style.setProperty("--accent-foreground", `oklch(${colors.fg})`);
      root.style.setProperty("--sidebar-accent", `oklch(${colors.secondary})`);
      root.style.setProperty("--sidebar-border", `oklch(${colors.border})`);

      // Neomorphism shadows
      root.style.setProperty(
        "--neo-shadow-light",
        `oklch(${colors.neoShadowLight})`,
      );
      root.style.setProperty(
        "--neo-shadow-dark",
        `oklch(${colors.neoShadowDark})`,
      );
      root.style.setProperty(
        "--neo-inset-light",
        `oklch(${colors.neoInsetLight})`,
      );
      root.style.setProperty(
        "--neo-inset-dark",
        `oklch(${colors.neoInsetDark})`,
      );

      // Glassmorphism
      root.style.setProperty("--glass-bg", `oklch(${colors.glassBg})`);
      root.style.setProperty("--glass-border", `oklch(${colors.glassBorder})`);

      // Hover states for neomorphism
      root.style.setProperty("--hover-bg", `oklch(${colors.hoverBg})`);
      root.style.setProperty("--hover-glass", `oklch(${colors.hoverGlass})`);
      root.style.setProperty(
        "--hover-glass-border",
        `oklch(${colors.hoverGlassBorder})`,
      );
    }
  }, [backgroundColor]);

  // Listen for theme updates
  React.useEffect(() => {
    const handleThemeUpdate = (
      event: CustomEvent<{
        themeColor?: ThemeColor;
        backgroundColor?: BackgroundColor;
      }>,
    ) => {
      if (event.detail.themeColor) {
        setThemeColor(event.detail.themeColor);
      }
      if (event.detail.backgroundColor) {
        setBackgroundColor(event.detail.backgroundColor);
      }
    };

    window.addEventListener(
      "theme-updated" as any,
      handleThemeUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "theme-updated" as any,
        handleThemeUpdate as EventListener,
      );
    };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Helper function to trigger theme update across the app
export function updateAppTheme(data: {
  themeColor?: ThemeColor;
  backgroundColor?: BackgroundColor;
}) {
  const event = new CustomEvent("theme-updated", {
    detail: data,
  });
  window.dispatchEvent(event);
}
