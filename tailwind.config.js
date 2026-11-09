/* global module, require */
const { colors } = require('./src/styles/tailwindTokens.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Tokens de src/styles/tokens.css (spec-rediseno-02-c1). La paleta por defecto
      // de Tailwind se mantiene hasta que todo esté migrado (Capa 6).
      colors,
      // Sombras con valor en tokens.css (spec-rediseno-02-c2).
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
