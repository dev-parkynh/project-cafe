/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
               'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        apple: {
          blue:    '#0071E3',
          gray:    '#F5F5F7',
          dark:    '#1D1D1F',
          silver:  '#86868B',
          light:   '#FBFBFD',
        }
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'apple':    '0 2px 20px rgba(0,0,0,0.08)',
        'apple-lg': '0 8px 40px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
}
