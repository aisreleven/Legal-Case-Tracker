/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F1E33',
          800: '#142B4A', // Primary Navy
          700: '#1D3B63',
          600: '#24466B', // Secondary Blue
          500: '#325D8D',
          100: '#EBF1F7',
          50: '#F4F7FA',
        },
        gold: {
          DEFAULT: '#C6A15B', // Gold Accent
          50: '#FBF8F1',
          100: '#F6EEDB',
          200: '#ECDDB6',
          300: '#DFC88E',
          400: '#D3B46A',
          500: '#C6A15B',
          600: '#B08B42',
          700: '#8E6E32',
        },
        legal: {
          bg: '#F5F7FA',
          text: '#202B3C',
          muted: '#64748B',
          border: '#E5EAF0',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(20, 43, 74, 0.05), 0 2px 4px -2px rgba(20, 43, 74, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(20, 43, 74, 0.08), 0 4px 6px -4px rgba(20, 43, 74, 0.05)',
      }
    },
  },
  plugins: [],
}
