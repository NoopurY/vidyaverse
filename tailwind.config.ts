import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0B3D91", hover: "#082F6E", tint: "#E8EEF9" },
        saffron: "#FF9933",
        indgreen: "#138808",
        danger: "#C62828",
        warning: "#E6A700",
        success: "#138808",
        page: "#F5F7FA",
        line: "#DDE3EA",
        ink: "#1A1A1A",
        muted: "#5F6B7A",
      },
      fontFamily: {
        sans: ["var(--font-noto)", "var(--font-noto-deva)", "system-ui", "sans-serif"],
      },
      borderRadius: { DEFAULT: "8px", lg: "8px", md: "6px" },
      boxShadow: { card: "0 1px 2px rgba(16,24,40,0.04)" },
      fontSize: { kpi: ["1.75rem", { lineHeight: "2.25rem", fontWeight: "600" }] },
    },
  },
  plugins: [],
};
export default config;
