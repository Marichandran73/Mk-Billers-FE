/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d7edff',
          200: '#b8e1ff',
          400: '#2d9ad6',
          500: '#0f84c8',
          600: '#096da8',
          700: '#075583',
          800: '#0a4568',
        },
        ink: '#172033',
      },
      boxShadow: {
        soft: '0 16px 36px rgba(15, 23, 42, 0.09)',
      },
    },
  },
  plugins: [],
}
