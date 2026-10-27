import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zemin: "var(--zemin)", orman: "var(--orman)", adacayi: "var(--adacayi)",
        metin: "var(--metin)", soluk: "var(--soluk)", cizgi: "var(--cizgi)", yuzey: "var(--yuzey)",
      },
      fontFamily: { baslik: ["var(--font-baslik)", "Georgia", "serif"], govde: ["var(--font-govde)", "system-ui", "sans-serif"] },
      borderRadius: { DEFAULT: "6px" },
    },
  },
  plugins: [],
};
export default config;
