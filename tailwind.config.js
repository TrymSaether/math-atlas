/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        display: ['"DM Serif Display"', '"Cormorant Garamond"', "Georgia", "serif"],
        serif: ['"DM Serif Display"', '"Cormorant Garamond"', "Georgia", "serif"],
        math: ['"STIX Two Text"', '"STIX Two Math"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        "bg-deep": "var(--bg-deep)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        fg: {
          1: "var(--fg-1)",
          2: "var(--fg-2)",
          3: "var(--fg-3)",
          4: "var(--fg-4)",
        },
        border: "var(--border)",
        hairline: "var(--hairline)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          border: "var(--accent-border)",
        },
        domain: {
          blue: "var(--blue)",
          green: "var(--green)",
          purple: "var(--purple)",
          red: "var(--red)",
          teal: "var(--teal)",
          orange: "var(--orange)",
          pink: "var(--pink)",
          gold: "var(--gold)",
        },
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        card: "var(--shadow-1)",
        cardHover: "var(--shadow-2)",
        float: "var(--shadow-3)",
        panel: "-4px 0 24px rgba(15,23,42,0.06)",
      },
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};
