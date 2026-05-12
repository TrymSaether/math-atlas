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
          orange: "#ffb86c",
        },
      },
      spacing: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
        "5xl": "48px",
      },
      borderRadius: {
        sm: "5px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      fontSize: {
        xs: ["9px", "1.2"],
        sm: ["10px", "1.375"],
        base: ["12px", "1.5"],
        md: ["13px", "1.5"],
        lg: ["16px", "1.625"],
        xl: ["20px", "1.5"],
        "2xl": ["24px", "1.2"],
        "3xl": ["26px", "1.2"],
      },
      letterSpacing: {
        normal: "0em",
        wide: "0.18em",
        wider: "0.22em",
        widest: "0.28em",
      },
      zIndex: {
        background: "-10",
        canvas: "0",
        content: "10",
        overlay: "40",
        modal: "50",
        popover: "60",
        tooltip: "70",
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
