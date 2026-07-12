import type { Config } from "tailwindcss";

// Colors + fonts resolve to shared design-system CSS variables
// (design-system/tokens.css) so this app themes with the DS in light and dark.
// Agent accents keep literal hex equal to --ds-accent-1/-2 (Samsung Blue / violet)
// so Tailwind alpha modifiers still work where used for layout tints.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "var(--ds-brand)",
        "brand-fg": "var(--ds-brand-fg)",
        surface: "var(--ds-surface)",
        "surface-2": "var(--ds-surface-2)",
        edge: "var(--ds-border)",
        "edge-strong": "var(--ds-border-strong)",
        ink: "var(--ds-text)",
        "ink-muted": "var(--ds-text-muted)",
        "ink-subtle": "var(--ds-text-subtle)",
        analysis: "#0eb5a4", // DS accent-1 (Analysis) — mint
        msat: "#404040", // DS accent-2 (MSAT) — gray
      },
      fontFamily: {
        sans: "var(--ds-font-sans)",
        serif: "var(--ds-font-serif)",
        mono: "var(--ds-font-mono)",
      },
      borderRadius: {
        ds: "var(--ds-radius-md)",
        "ds-lg": "var(--ds-radius-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
