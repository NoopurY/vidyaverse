import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
<<<<<<< HEAD
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
=======
        navy: {
          DEFAULT: "#0B3D91",
          deep: "#082B63",
          hover: "#082B63",
          light: "#EBF2FA",
          tint: "#E8EEF9",
        },
        saffron: {
          DEFAULT: "#FF9933",
          light: "#FFF5E8",
          hover: "#E68524",
          tint: "#FFF0DE",
        },
        indgreen: {
          DEFAULT: "#138808",
          light: "#EAF7EF",
          hover: "#0F6D06",
          tint: "#E7F4E4",
        },
        danger: {
          DEFAULT: "#C62828",
          light: "#FDECEC",
          hover: "#A51F1F",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FFF5E8",
          hover: "#B45309",
        },
        success: {
          DEFAULT: "#138808",
          light: "#EAF7EF",
          hover: "#0F6D06",
        },
        // homepage palette (kept separate so the portal screens keep their existing tokens)
        vv: {
          navy: "#10234E",
          blue: "#0648B5",
          blue2: "#2166D1",
          saffron: "#FF8A18",
          green: "#169447",
          ice: "#F1F7FF",
          text: "#14264A",
          muted: "#536581",
          line: "#DCE7F5",
          greenbg: "#EFFAF3",
          orangebg: "#FFF6EC",
        },
        page: "#F5F8FC",
        line: "#DCE5F0",
        ink: {
          DEFAULT: "#152238",
          secondary: "#64748B",
        },
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "var(--font-noto)", "var(--font-noto-deva)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(11, 61, 145, 0.05), 0 1px 2px -1px rgba(11, 61, 145, 0.05)",
        elevated: "0 4px 6px -1px rgba(11, 61, 145, 0.07), 0 2px 4px -2px rgba(11, 61, 145, 0.05)",
        dropdown: "0 10px 15px -3px rgba(11, 61, 145, 0.08), 0 4px 6px -4px rgba(11, 61, 145, 0.04)",
        modal: "0 20px 25px -5px rgba(11, 61, 145, 0.1), 0 8px 10px -6px rgba(11, 61, 145, 0.05)",
      },
      fontSize: {
        kpi: ["2rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        display: ["3.25rem", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.02em" }],
      },
>>>>>>> c4621d2a776483b138be0f0ba672019a42922020
    },
  },
  plugins: [],
};
export default config;
