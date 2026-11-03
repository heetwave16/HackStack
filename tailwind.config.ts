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
        background: "var(--background)",
        foreground: "var(--foreground)",
        hackstack: {
          bg: "#090D16",
          surface: "#0F172A",
          card: "#131C2E",
          border: "#1E293B",
          accent: "#10B981",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"]
      }
    },
  },
  plugins: [],
} satisfies Config;
