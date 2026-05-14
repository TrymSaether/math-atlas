/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        serif: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        domain: {
          blue: "#2563eb",
          green: "#16a34a",
          purple: "#7c3aed",
          red: "#dc2626",
          teal: "#0d9488",
          orange: "#f97316",
          pink: "#db2777",
          gold: "#eab308",
        },
      },
      boxShadow: {
        "ma-1": "0 1px 2px rgba(15,23,42,0.04)",
        "ma-2": "0 4px 12px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "ma-3": "0 12px 32px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.05)",
      },
      borderRadius: {
        "ma-sm": "6px",
        "ma-md": "10px",
        "ma-lg": "14px",
        "ma-xl": "20px",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.22, 0.61, 0.36, 1)",
        "ma-out": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
