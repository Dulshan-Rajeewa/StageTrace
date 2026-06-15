/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f3ff',
        'dark-bg': '#0b0e14',
        'glass-dark': 'rgba(20, 25, 35, 0.5)',
      },
      backdropFilter: {
        'glass': 'blur(12px)',
      },
    },
  },
  plugins: [],
}
