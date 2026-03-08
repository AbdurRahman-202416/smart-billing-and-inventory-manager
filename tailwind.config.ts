import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideInUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scanFlash: {
          "0%":   { opacity: "0" },
          "25%":  { opacity: "0.55" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "slide-in-up": "slideInUp 0.22s ease-out",
        "scan-flash":  "scanFlash 0.45s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
