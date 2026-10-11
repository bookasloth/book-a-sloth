/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FE5100",
        "primary-dark": "#d94400",
        // White-text buttons only. #FE5100 + white = 3.26:1 (fails WCAG AA);
        // this darker shade = ~5.3:1. Keep `primary` for accents/large text.
        "primary-cta": "#c23d00",
        "primary-light": "#FFE9DD",
        secondary: "#f59e0b",
        surface: "#ffffff",
        muted: "#6b7280",
        ink: "#1a1a1a",
        sand: "#f4f1ea",
        canvas: "#faf9f6",
        // Accent palette — reusable multi-hue accents (Calendly-style colour).
        // Mirrors --c-* in src/styles/design-tokens.css — keep both in sync.
        // Literal hex (not var) so Tailwind's /opacity modifier can compute alpha.
        "c-blue": "#2563eb",
        "c-violet": "#7c3aed",
        "c-cyan": "#0891b2",
        "c-emerald": "#059669",
        "c-amber": "#f59e0b",
        "c-pink": "#db2777",
      },
      fontFamily: {
        sans: ["Poppins", "Poppins Fallback", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Plus Jakarta Sans Fallback", "Poppins", "system-ui", "sans-serif"],
      },
      // Global radius rule: 4px max; 6px only for a wrapper that contains a 4px child.
      // `full` kept for pills/avatars. Overrides Tailwind's default rounded-* scale app-wide.
      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "4px",
        md: "4px",
        lg: "4px",
        xl: "6px",
        "2xl": "6px",
        "3xl": "6px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
