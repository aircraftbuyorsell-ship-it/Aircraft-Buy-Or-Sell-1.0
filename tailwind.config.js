/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    "bg-[#F8C73E]", "text-[#F8C73E]", "border-[#F8C73E]",
    "bg-[#53C4A2]", "text-[#53C4A2]", "border-[#53C4A2]",
    "bg-[#8EB7DC]", "text-[#8EB7DC]", "border-[#8EB7DC]",
    "bg-[#071018]", "bg-[#0C1620]", "bg-[#101D28]",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#F8C73E',
          bright: '#FFD75E',
          deep: '#D9A91E',
        },
        amber: {
          DEFAULT: '#F8C73E',
          bright: '#FFD75E',
          deep: '#D9A91E',
        },
        teal: {
          DEFAULT: '#53C4A2',
          soft: 'rgba(83,196,162,0.12)',
        },
        sky: {
          DEFAULT: '#8EB7DC',
          soft: 'rgba(142,183,220,0.12)',
        },
        ink: {
          DEFAULT: '#071018',
          surface: '#0C1620',
          panel: '#101D28',
        },
        silver: {
          DEFAULT: '#9aa5b4',
          bright: '#c8d0db',
        },
        cyan: {
          DEFAULT: '#00f5ff',
          muted: '#00c2cb',
        },
        magenta: {
          DEFAULT: '#e040fb',
          deep: '#cc00ff',
        },
        bronze: '#CD7F32',
        charcoal: '#0d0e12',
        'card-dark': '#14161e',
        'sidebar-dark': '#0a0b0e',
        'main-bg': '#F7F4EF',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s cubic-bezier(0.32,0.72,0,1)',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.32,0.72,0,1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
