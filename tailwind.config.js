/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Salon brand palette - reused everywhere via Tailwind classes.
        brand: {
          50: "#fdf4f8",
          100: "#fbe8f1",
          200: "#f7cfe1",
          300: "#f2a8c8",
          400: "#e9739f",
          500: "#dd4b81", // primary
          600: "#c72f66",
          700: "#a52251",
          800: "#882045",
          900: "#72203d",
        },
        gold: {
          400: "#e6c976",
          500: "#d4af37", // luxury accent
          600: "#b8942c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};
