
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        medflux: {
          bg: '#0a0e1a',
          panel: '#0f172a',
        }
      },
      boxShadow: {
        'glow-red': '0 0 20px 5px rgba(239, 68, 68, 0.6)',
        'glow-orange': '0 0 20px 5px rgba(249, 115, 22, 0.6)',
        'glow-blue': '0 0 20px 5px rgba(59, 130, 246, 0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse-red 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse-red': {
          '0%, 100%': { boxShadow: '0 0 15px 3px rgba(239, 68, 68, 0.5)' },
          '50%': { boxShadow: '0 0 30px 8px rgba(239, 68, 68, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
