/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ll: {
          bg: "#0A0D0F",
          elevated: "#0d1114",
          muted: "#141a1e",
          border: "#1e2326",
          accent: "#00FF9C",
          text: "#c8d5de",
          "text-muted": "#6b7a85",
          "text-dim": "#4a5e6a",
          "text-faint": "#3a5060",
          error: "#e05555",
          warn: "#f0a832",
          info: "#378ADD",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        ll: "7px",
      },
    },
  },
  plugins: [],
};
