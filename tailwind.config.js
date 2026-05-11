/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        serif: ['"EB Garamond"', "Georgia", "serif"],
      },
      colors: {
        ink: {
          950: "#05060a",
          900: "#0a0d18",
          800: "#10142a",
          700: "#161c3a",
          600: "#1e2547",
          500: "#2a3360",
        },
        accent: {
          cyan: "#5ce1ff",
          violet: "#a78bff",
          gold: "#ffd58a",
          rose: "#ff8fb1",
          mint: "#7af3c4",
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(124,160,255,0.55)",
        "glow-cyan": "0 0 30px -6px rgba(92,225,255,0.6)",
        "glow-violet": "0 0 30px -6px rgba(167,139,255,0.6)",
      },
      keyframes: {
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-12px,0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        scan: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 200px" },
        },
      },
      animation: {
        drift: "drift 10s ease-in-out infinite",
        ring: "pulseRing 4s ease-out infinite",
        scan: "scan 12s linear infinite",
      },
    },
  },
  plugins: [],
};
