import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          dark: "#000000",
          surface: "#121214",
          card: "#1C1C1E",
          hover: "#2C2C2E",
          border: "#3A3A3C",
          subtext: "#86868B",
          text: "#F5F5F7",
          blue: "#0071E3",
          blueHover: "#0077ED",
          blueAccent: "#2997FF",
          lightBg: "#F5F5F7",
          lightCard: "#FFFFFF",
          lightBorder: "#E5E5EA",
          lightSubtext: "#6E6E73",
        },
        stem: {
          vocals: "#6366F1",
          drums: "#F43F5E",
          bass: "#10B981",
          other: "#F59E0B",
          instrumental: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        apple: "0 4px 24px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        "apple-dark": "0 8px 32px -4px rgba(0, 0, 0, 0.4), 0 2px 8px -2px rgba(0, 0, 0, 0.3)",
        glow: "0 0 30px rgba(0, 113, 227, 0.25)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
