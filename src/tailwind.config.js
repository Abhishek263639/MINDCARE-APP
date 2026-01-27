/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{html,ts}", 
    ],
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['Poppins', 'sans-serif'],
        },
        animation: {
          'pulse-slow': 'pulse-slow 8s infinite ease-in-out',
          'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
          'pop-in': 'pop-in 0.4s ease-out forwards',
        },
        keyframes: {
          'pulse-slow': {
            '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
            '50%': { opacity: 0.6, transform: 'scale(1.1)' },
          },
          'fade-in-up': {
            'from': { opacity: '0', transform: 'translateY(20px)' },
            'to': { opacity: '1', transform: 'translateY(0)' },
          },
          'pop-in': {
            '0%': { opacity: '0', transform: 'scale(0.8)' },
            '80%': { opacity: '1', transform: 'scale(1.1)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
          },
        }
      },
    },
    plugins: [],
  }