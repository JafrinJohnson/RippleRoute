/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-2": "var(--bg-2)",
        glass: "var(--glass)",
        "glass-border": "var(--glass-border)",
        text: "var(--text)",
        muted: "var(--muted)",
        primary: "var(--primary)",
        cyan: "var(--cyan)",
        pink: "var(--pink)",
        safe: "var(--safe)",
        warn: "var(--warn)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        tamil: ["var(--font-noto-sans-tamil)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.25)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.15)",
        glow: "0 0 25px -4px var(--primary)",
        "glow-cyan": "0 0 25px -4px var(--cyan)",
        "glow-pink": "0 0 25px -4px var(--pink)",
        "glow-safe": "0 0 25px -4px var(--safe)",
        "glow-warn": "0 0 25px -4px var(--warn)",
        "glow-danger": "0 0 25px -4px var(--danger)",
        "inner-glow": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)",
      },
      animation: {
        "aurora-slow": "aurora 24s ease-in-out infinite alternate",
        "pulse-subtle": "pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s infinite linear",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        aurora: {
          "0%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
          "50%": { transform: "translate(40px, -30px) scale(1.12) rotate(180deg)" },
          "100%": { transform: "translate(-30px, 40px) scale(0.95) rotate(360deg)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
