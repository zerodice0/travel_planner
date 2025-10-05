/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ee',
          100: '#fde8d7',
          200: '#fbcdae',
          300: '#f8ab7a',
          400: '#f47d44',
          500: '#f15a20',
          600: '#e23e16',
          700: '#bb2d14',
          800: '#952618',
          900: '#792216',
          950: '#410e09',
        },
        error: '#EF4444',
      },
    },
  },
  plugins: [],
};
