/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mumbai kaali-peeli taxi palette
        taxi: { DEFAULT: '#FFC629', deep: '#F2B300', soft: '#FFF3C9' },
        ink: { DEFAULT: '#1C1C1C', 2: '#3A3A3A' },
        road: { DEFAULT: '#6B7075', light: '#A4A9AE' },
        surface: { DEFAULT: '#F2F3F5', 2: '#E6E8EB' },
        go: { DEFAULT: '#1E9E5A', soft: '#E3F5EB' },
        stop: { DEFAULT: '#D93025', soft: '#FDECEA' },
        night: { DEFAULT: '#151618', 2: '#202226', 3: '#2C2F34' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Figtree Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sheet: '28px' },
      boxShadow: {
        sheet: '0 -8px 30px rgba(28,28,28,0.12)',
        float: '0 4px 14px rgba(28,28,28,0.16)',
      },
    },
  },
  plugins: [],
}
