/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F7FB",
        surface: "#FFFFFF",
        ink: "#14181F",
        navy: {
          DEFAULT: "#0A1A44",
          light: "#13276B",
          dark: "#07122F",
        },
        accent: "#2563EB",
        amber: {
          DEFAULT: "#E3A23A",
          light: "#F0BC63",
        },
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
        },
        // The four accent colours of the stat cards.
        vel: {
          pink: "#F1507E",
          purple: "#7266BA",
          blue: "#34B0E0",
          teal: "#3BC0C3",
        },
        link: "#2563EB",
        success: "#16A34A",
        danger: "#E11D48",
        line: "#E8EAEE",
      },
      fontFamily: {
        serif: ["Inter", "Noto Sans Arabic", "system-ui", "sans-serif"], // headings use the same clean sans
        sans: ["Inter", "Noto Sans Arabic", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
