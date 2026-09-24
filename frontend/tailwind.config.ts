import type { Config } from "tailwindcss";

/**
 * The palette is intentionally small: a neutral slate UI with one blue accent
 * and four status colours. Status colour is the only strong colour on screen,
 * so "amber = waiting" and "green = being served" read instantly.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dbe6fe", 200: "#bfd3fe", 300: "#93b4fd",
          400: "#608efa", 500: "#3b6bf6", 600: "#254deb", 700: "#1d3cd8",
          800: "#1e33af", 900: "#1e318a",
        },
      },
      borderRadius: { xl: "0.75rem", "2xl": "1rem" },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        pulseRing: { "0%": { transform: "scale(.9)", opacity: "0.7" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
      },
      animation: {
        "fade-up": "fade-up .25s ease-out both",
        "pulse-ring": "pulseRing 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
