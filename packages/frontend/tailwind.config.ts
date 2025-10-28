import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "oklch(var(--color-border))",
        input: "oklch(var(--color-input))",
        ring: "oklch(var(--color-ring))",
        background: "oklch(var(--color-background))",
        foreground: "oklch(var(--color-foreground))",
        primary: {
          DEFAULT: "oklch(var(--color-primary))",
          foreground: "oklch(var(--color-primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--color-secondary))",
          foreground: "oklch(var(--color-secondary-foreground))",
        },
        destructive: "oklch(var(--color-destructive))",
        muted: {
          DEFAULT: "oklch(var(--color-muted))",
          foreground: "oklch(var(--color-muted-foreground))",
        },
        accent: {
          DEFAULT: "oklch(var(--color-accent))",
          foreground: "oklch(var(--color-accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--color-popover))",
          foreground: "oklch(var(--color-popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--color-card))",
          foreground: "oklch(var(--color-card-foreground))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--color-sidebar))",
          foreground: "oklch(var(--color-sidebar-foreground))",
          primary: "oklch(var(--color-sidebar-primary))",
          "primary-foreground": "oklch(var(--color-sidebar-primary-foreground))",
          accent: "oklch(var(--color-sidebar-accent))",
          "accent-foreground": "oklch(var(--color-sidebar-accent-foreground))",
          border: "oklch(var(--color-sidebar-border))",
          ring: "oklch(var(--color-sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-in": "slideIn 0.5s ease-out",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "100%": { boxShadow: "0 0 30px rgba(99, 102, 241, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
