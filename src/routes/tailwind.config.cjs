/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // 🌟 Tüm src içindeki dosyaları kapsar
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
