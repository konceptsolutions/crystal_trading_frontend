import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#ff6b35',
          50: '#fff5f2',
          100: '#ffe4d9',
          200: '#ffc9b3',
          300: '#ffa88d',
          400: '#ff8767',
          500: '#ff6b35',
          600: '#e55a2b',
          700: '#cc4a21',
          800: '#b33a17',
          900: '#992a0d',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
export default config

