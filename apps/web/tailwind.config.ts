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
          DEFAULT: "#0f1c28",
          soft: "#1e3344",
          mute: "#6b8294",
        },
        paper: {
          DEFAULT: "#f4f7fa",
          deep: "#e4ecf2",
        },
        mist: {
          DEFAULT: "#e8eef3",
          deep: "#d3dde7",
        },
        signal: {
          DEFAULT: "#1a9f8c",
          bright: "#24c4ad",
          dim: "#0f6f62",
        },
        ember: {
          DEFAULT: "#e8913a",
          soft: "#f0a35a",
        },
        panel: {
          DEFAULT: "#12202e",
          deep: "#0f1c28",
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
