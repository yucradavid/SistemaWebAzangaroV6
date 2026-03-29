/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cermat: {
          'blue-dark': '#193375',  // Primary: Headers, High Hierarchy
          'blue-light': '#4472C4', // Secondary: Interactions, Cards
          'red': '#E7081A',        // Accent: Alerts, Logout
        }
      },
      backgroundImage: {
        'school-pattern': "url('/assets/fondo-colegio.jpeg')",
      },
      keyframes: {
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in-scale': 'fade-in-scale 0.8s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
      }
    },
  },
  plugins: [],
};
