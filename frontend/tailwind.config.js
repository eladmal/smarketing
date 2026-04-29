/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#85aaff',
          400: '#4d7eff',
          500: '#2855f5',
          600: '#1a3deb',
          700: '#152ed4',
          800: '#1727ab',
          900: '#182687',
        }
      },
    },
  },
  plugins: [],
}
