import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      colors: {
        background: '#FFFFFF',
        foreground: '#333333',
        'brand-primary': '#002F6C', // Dark blue for header
        'brand-primary-hover': '#0056B3',
        'brand-secondary': '#E91E63', // Pink for discounts
        'brand-accent': '#FF9800', // Orange for buttons
        'brand-success': '#2E7D32',
        'brand-neutral-light': '#F5F5F5',
        'brand-neutral-dark': '#333333',
        'brand-text-secondary': '#666666',
        // Hites brand colors
        'hites-strong-blue': '#0056B3',
        'hites-magenta': '#E91E63',
        'hites-yellow': '#FFD700',
        'hites-text-black': '#333333',
        'hites-text-gray': '#666666',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
