import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0c1522",
          soft: "#1e2d3d",
          mute: "#5a6b7c",
        },
        paper: {
          DEFAULT: "#f3f5f7",
          deep: "#e6eaef",
        },
        mist: {
          DEFAULT: "#eef1f4",
          deep: "#d3dde7",
        },
        signal: {
          DEFAULT: "#0e7c6b",
          bright: "#1aa890",
          dim: "#0a5c50",
        },
        ember: {
          DEFAULT: "#c47a2c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
        body: ["var(--font-body)", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
