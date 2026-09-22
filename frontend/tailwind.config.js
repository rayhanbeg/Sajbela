/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ---------------------------------------------------------------
        // BRAND PALETTE — DO NOT CHANGE THESE VALUES.
        // The whole storefront + admin + transactional emails are built on
        // this exact scale. `brand` below is an alias, not a new colour.
        // ---------------------------------------------------------------
        pink: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        // Semantic aliases -> identical hexes to the pink scale above.
        // Lets components read `bg-brand` instead of memorising `pink-600`.
        brand: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          DEFAULT: "#db2777",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // Fluid type scale for display headings, so hero/section titles scale
      // smoothly between 375px and 1440px instead of stepping at breakpoints.
      fontSize: {
        "display-sm": ["clamp(1.5rem, 1.2rem + 1.4vw, 2rem)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(1.875rem, 1.4rem + 2.1vw, 2.75rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.25rem, 1.6rem + 3vw, 3.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },

      borderRadius: {
        card: "0.875rem",
        sheet: "1.25rem",
        pill: "9999px",
      },

      boxShadow: {
        card: "0 1px 2px 0 rgb(17 24 39 / 0.04), 0 1px 3px 0 rgb(17 24 39 / 0.06)",
        "card-hover": "0 10px 25px -5px rgb(17 24 39 / 0.10), 0 8px 10px -6px rgb(17 24 39 / 0.06)",
        drawer: "0 25px 50px -12px rgb(17 24 39 / 0.25)",
        nav: "0 -1px 3px 0 rgb(17 24 39 / 0.06), 0 -4px 12px -4px rgb(17 24 39 / 0.08)",
        focus: "0 0 0 3px rgb(236 72 153 / 0.35)",
      },

      spacing: {
        // Mobile bottom-nav height + the iOS home-indicator inset.
        // `pb-bottom-nav` on scroll containers guarantees no occluded content.
        "bottom-nav": "calc(4rem + env(safe-area-inset-bottom, 0px))",
        "safe-b": "env(safe-area-inset-bottom, 0px)",
        "safe-t": "env(safe-area-inset-top, 0px)",
      },

      height: {
        "bottom-nav": "calc(4rem + env(safe-area-inset-bottom, 0px))",
      },

      screens: {
        xs: "375px",
      },

      zIndex: {
        header: "40",
        "bottom-nav": "45",
        overlay: "50",
        drawer: "55",
        modal: "60",
        toast: "70",
      },

      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },

      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "fade-in-up": "fade-in-up 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slide-in-right 280ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-left": "slide-in-left 280ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-up": "slide-up 280ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
}
