/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta editorial CERMAT
        cermat: {
          blue: {
            50: '#f0f4f8',
            100: '#d9e2ec',
            200: '#bcccdc',
            300: '#9fb3c8',
            400: '#829ab1',
            500: '#627d98',
            600: '#486581',
            700: '#334e68',
            800: '#243b53',
            900: '#102a43',
            950: '#0a1929',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#eab308',
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          }
        },
        // Colores editoriales
        editorial: {
          cream: '#FAFAF8',
          warm: '#F5F3EF',
          gold: '#B8860B',
          'gold-light': '#D4A843',
          navy: '#102A43',
          slate: '#334E68',
          muted: '#627D98',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '900' }],
        'display-lg': ['clamp(3.5rem, 10vw, 8rem)', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '900' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out backwards',
        'fade-in-delay': 'fadeIn 0.8s ease-out 0.2s backwards',
        'slide-up': 'slideUp 0.6s ease-out backwards',
        'counter': 'counter 2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
