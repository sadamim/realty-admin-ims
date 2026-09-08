import type { Config } from "tailwindcss";

/**
 * Design tokens for the admin panel.
 * The brand values (navy / ink / brand red) are unchanged — they are only
 * extended into full scales so the UI can build hierarchy without new colours.
 */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        navy: {
          DEFAULT: "#1b2a41",
          50: "#f4f6fa",
          100: "#e7ecf3",
          200: "#c9d4e4",
          300: "#9fb1cb",
          400: "#6c85a8",
          500: "#476084",
          600: "#2f4665",
          700: "#243651",
          800: "#1b2a41",
          900: "#111c2c",
        },
        ink: "#0f1721",
        brand: {
          DEFAULT: "#c8102e",
          50: "#fef3f4",
          100: "#fde4e7",
          600: "#ad0d27",
          700: "#8c0a1f",
        },
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 33 / 0.04), 0 1px 3px 0 rgb(15 23 33 / 0.05)",
        "card-hover":
          "0 6px 16px -6px rgb(15 23 33 / 0.12), 0 2px 6px -2px rgb(15 23 33 / 0.06)",
        pop: "0 12px 32px -12px rgb(15 23 33 / 0.28), 0 2px 8px -3px rgb(15 23 33 / 0.12)",
        rail: "1px 0 0 0 rgb(15 23 33 / 0.06)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms cubic-bezier(0.22,1,0.36,1) both",
        "fade-up": "fade-up 340ms cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 200ms cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-left": "slide-in-left 280ms cubic-bezier(0.22,1,0.36,1) both",
        "toast-in": "toast-in 260ms cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
