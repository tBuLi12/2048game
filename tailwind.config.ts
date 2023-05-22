import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fade-in 100ms ease-in-out",
        pop: "pop 100ms ease-in-out",
      },
      boxShadow: {
        tile: `rgba(0, 0, 0, 0.4) 0px -6px 12px 0px inset, rgba(0, 0, 0, 0.3) 0px 6px 12px`,
        empty: `rgba(0, 0, 0, 0.4) 0px 3px 6px 0px inset`,
        button: `rgba(0, 0, 0, 1) 2px 2px 4px 1px`,
      },
      screens: {
        tablet: "450px",
      },
      spacing: {
        tile: "calc((100% - 5 * var(--grid-spacing)) / 4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
