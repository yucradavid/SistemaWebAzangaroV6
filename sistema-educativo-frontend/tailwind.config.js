/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores institucionales CERMAT
        cermat: {
          blue: {
            50: '#E6ECF7',
            100: '#D4DEF2',
            200: '#B0C3E6',
            300: '#8CA8DB',
            400: '#688DCF',
            500: '#4472C4',
            600: '#2F539D',
            700: '#193375',
            800: '#142A63',
            900: '#0F1F4D',
            950: '#081029',
          },
          red: {
            50: '#FEEFEE',
            100: '#FCD9DC',
            200: '#FAB4BA',
            300: '#F5818B',
            400: '#F05460',
            500: '#EC2836',
            600: '#E7081A',
            700: '#C10515',
            800: '#9A0612',
            900: '#780811',
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
        // Colores editoriales (landing rediseño V1)
        editorial: {
          cream: '#FAFAF8',
          warm: '#F5F3EF',
          gold: '#B8860B',
          'gold-light': '#D4A843',
          navy: '#193375',
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
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 8s ease-in-out infinite',
        'slide-up': 'slideUp 0.8s ease-out backwards',
        'fade-in': 'fadeIn 0.6s ease-in-out backwards',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'spin-reverse-slow': 'spin-reverse 15s linear infinite',
        'spin-very-slow': 'spin 30s linear infinite',
        'scroll-dot': 'scrollDot 2s ease-in-out infinite',
        'gradient': 'gradient 3s ease infinite',
        'subtle-zoom': 'subtleZoom 20s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(-3deg)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        scrollDot: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '50%': { transform: 'translateY(12px)', opacity: '0.5' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        subtleZoom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}