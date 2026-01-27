/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wine-red': '#722f37',
        'wine-red-dark': '#4a1c24',
        'wine-gold': '#c9a962',
      },
    },
  },
  plugins: [],
}
