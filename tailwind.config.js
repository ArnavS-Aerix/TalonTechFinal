/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1a2744',
          'navy-light': '#243a5e',
          gold: '#c4a35a',
          'gold-light': '#d4b96a',
          'gold-dark': '#a88c3f',
          orange: '#e67e22',
          'orange-light': '#f39c12',
          'orange-dark': '#d35400',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
