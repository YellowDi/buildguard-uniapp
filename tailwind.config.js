/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1fff6',
          100: '#dbffe9',
          300: '#72e596',
          400: '#3dd36a',
          500: '#24c35b'
        }
      },
      boxShadow: {
        panel: '0 20px 50px rgba(17, 24, 39, 0.12)',
        dock: '0 12px 28px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: [],
}
