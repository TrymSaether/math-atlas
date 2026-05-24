/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Helvetica Neue"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        math: ['"STIX Two Text"', '"New Computer Modern"', "Georgia", "Cambria", "serif"],
        mono: ['"SF Mono"', '"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        canvas: {
          DEFAULT: "#F7F5F0",
          raised: "#FFFFFF",
          muted: "#EFEDE7",
        },
        ink: {
          900: "#1C1C1E",
          800: "#2C2C2E",
          700: "#3A3A3C",
          500: "#6E6E73",
          400: "#8E8E93",
          300: "#AEAEB2",
          200: "#C7C7CC",
          100: "#E5E5EA",
          50: "#F2F2F7",
        },
        accent: {
          blue: "#0A84FF",
          blueSoft: "#E6F0FF",
        },
        hairline: "rgba(0,0,0,0.08)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.03)",
        cardHover: "0 6px 20px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        float: "0 12px 32px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)",
        panel: "-4px 0 24px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};
