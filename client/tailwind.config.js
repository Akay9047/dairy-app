/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef9ee",
          100: "#fdf0d0",
          200: "#f9dc9d",
          300: "#f5c163",
          400: "#f1a530",
          500: "#ed8c18",
          600: "#d46c10",
          700: "#b05010",
          800: "#8c3e14",
          900: "#723413",
        },
      },
    },
  },
  plugins: [],
};
