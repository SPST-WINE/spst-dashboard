/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'spst-blue': '#1c3e5e',
        'spst-orange': '#f7911e',
      },
    },
  },
  plugins: [],
};
