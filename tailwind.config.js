// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1200px' } },
    extend: {
  colors: {
    'spst-blue': '#1c3e5e',
    'spst-orange': '#f7911e',
  },
}
    },
  },
  plugins: [],
};
