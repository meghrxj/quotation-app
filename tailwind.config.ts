import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#467EB3", dark: "#35618B" },
        navy: "#1B2B3D",
        ink: "#222B36",
        soft: "#F3F6F9",
        cream: "#F4F1EA",
      },
    },
  },
  plugins: [],
};
export default config;
