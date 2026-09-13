/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF9",
        surface: "#FFFFFF",
        ink: "#14181F",
        navy: {
          DEFAULT: "#1F3A5F",
          light: "#2E5386",
          dark: "#152943",
        },
        amber: {
          DEFAULT: "#C98A2C",
          light: "#E3A94F",
        },
        brand: {
          DEFAULT: "#C2410C",
          dark: "#9A3412",
        },
        link: "#1F3A5F",
        success: "#2F7A4D",
        danger: "#B3402A",
        line: "#E7E5E0",
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
