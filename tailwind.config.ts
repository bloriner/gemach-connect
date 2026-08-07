import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f8f6ee",
          100: "#f0ebd8",
          200: "#e2d8b1",
          300: "#d2c186",
          400: "#c9a84c",
          500: "#b8963a",
          600: "#a07b2e",
          700: "#805f28",
          800: "#6b4e28",
          900: "#5c4327",
          950: "#352314",
        },
        navy: {
          50: "#eef2ff",
          100: "#d9e2ff",
          200: "#bcc9ff",
          300: "#8ea5ff",
          400: "#5974ff",
          500: "#3349ff",
          600: "#1a27f5",
          700: "#131ce0",
          800: "#151bb5",
          900: "#0f172a",
          950: "#0a0f1e",
        },
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
