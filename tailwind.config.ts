import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Design system colors
        "purple-dark": "#0F0032",
        "purple-primary": "#4B4596",
        "purple-medium": "#3D2F77",
        "purple-accent": "#AA67DB",
        "purple-border": "#412058",
        "purple-deep": "#2E1755",
        "purple-section": "#38276C",
        "purple-soft": "#8C5C70",
        "orange-primary": "#EA9267",
        "orange-accent": "#F37A71",
        coral: "#EF568E",
        "coral-pink": "#EA4392",
        salmon: "#DB8C5C",
        gold: "#D7A64D",
        "gray-light": "#F9F9F9",
        "gray-medium": "#F6F6F6",
        "gray-dark": "#EDEDED",
        "gray-text": "#434343",
        "gray-border": "#D8D8D8",
        "gray-divider": "#A5A5A5",

        // Shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        sans: ["Poppins", "-apple-system", "Roboto", "Helvetica", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        "gradient-primary":
          "radial-gradient(705.25% 127.17% at 98.53% 9.8%, #F37A71 17.35%, #DB8C5C 58.29%, #EF568E 100%)",
        "gradient-secondary":
          "radial-gradient(961% 212.2% at 0% -30.83%, #2E1755 17.35%, #38276C 58.29%, #8C5C70 100%)",
        "gradient-purple":
          "linear-gradient(278deg, #EA9267 -28.58%, #4B4596 30.07%, #0F0032 105.34%)",
        "gradient-orange":
          "radial-gradient(99.41% 138.74% at 0% 0%, #F37A71 17%, #DB8C5C 53%, #EF568E 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
