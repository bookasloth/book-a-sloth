/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FE5100",
        "primary-dark": "#d94400",
        "primary-light": "#FFE9DD",
        secondary: "#f59e0b",
        surface: "#ffffff",
        muted: "#6b7280",
        ink: "#1a1a1a",
        sand: "#f4f1ea",
        canvas: "#faf9f6",
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Poppins", "system-ui", "sans-serif"],
        editorial: ["Fraunces", "Georgia", "serif"],
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
