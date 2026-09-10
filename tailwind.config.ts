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
        // Sampled from the live site at realtyfocus.info: the logo wordmark and
        // headings are rgb(9,5,69), the Submit button is rgb(192,15,27). The
        // panel already references these tokens everywhere, so changing the
        // values here re-brands the whole admin.
        navy: {
          DEFAULT: "#090545",
          50: "#f4f4fa",
          100: "#e7e6f3",
          200: "#c8c6e3",
          300: "#a09cc9",
          400: "#6f69a8",
          500: "#4a4285",
          600: "#332a68",
          700: "#231a56",
          800: "#150c4b",
          900: "#090545",
        },
        ink: "#0b0729",
        brand: {
          DEFAULT: "#c00f1b",
          50: "#fef3f4",
          100: "#fde3e5",
          600: "#a50c17",
          700: "#870a13",
        },
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(9 5 69 / 0.04), 0 1px 3px 0 rgb(9 5 69 / 0.05)",
        "card-hover":
          "0 6px 16px -6px rgb(9 5 69 / 0.12), 0 2px 6px -2px rgb(9 5 69 / 0.06)",
        pop: "0 12px 32px -12px rgb(9 5 69 / 0.28), 0 2px 8px -3px rgb(9 5 69 / 0.12)",
        rail: "1px 0 0 0 rgb(9 5 69 / 0.06)",
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
