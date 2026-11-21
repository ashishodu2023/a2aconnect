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
          DEFAULT: "#12202e",
          soft: "#2a3b4d",
          mute: "#5c6f82",
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
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        atmosphere:
          "radial-gradient(1200px 600px at 10% -10%, rgba(36,196,173,0.18), transparent 55%), radial-gradient(900px 500px at 90% 10%, rgba(232,145,58,0.12), transparent 50%), linear-gradient(165deg, #f4f7fa 0%, #e8eef3 45%, #dfe8ef 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-node": {
          "0%, 100%": { opacity: "0.45", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        "draw-line": {
          "0%": { strokeDashoffset: "120" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-up-delay": "fade-up 0.7s ease-out 0.12s both",
        "fade-up-delay-2": "fade-up 0.7s ease-out 0.24s both",
        "pulse-node": "pulse-node 2.8s ease-in-out infinite",
        "draw-line": "draw-line 1.4s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
