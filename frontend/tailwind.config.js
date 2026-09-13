/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5F0",
        surface: "#FFFFFF",
        ink: "#1C2321",
        navy: {
          DEFAULT: "#1F3A5F",
          light: "#2E5386",
          dark: "#152943",
        },
        amber: {
          DEFAULT: "#C98A2C",
          light: "#E3A94F",
        },
        success: "#2F7A4D",
        danger: "#B3402A",
        line: "#E1DDD1",
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
