/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0f2b5c',
          navyDark: '#0a1d3f',
          blue: '#1b4b9b',
          saffron: '#e86a17',
          green: '#1a7e3d',
          gold: '#d99726',
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
