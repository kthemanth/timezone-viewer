/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        glass: {
          base: '#06061a',
          surface: '#0d0d2b',
          raised: '#111135',
        },
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'now-pulse': 'now-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
        'slide-in': 'slide-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-out': 'slide-out 0.2s ease both',
        'page-enter': 'page-enter 0.3s ease both',
        'modal-enter': 'modal-enter 0.25s ease both',
      },
      keyframes: {
        'now-pulse': {
          '0%,100%': { opacity: '0.7', boxShadow: '0 0 6px rgba(217,70,239,0.8)' },
          '50%': { opacity: '1', boxShadow: '0 0 14px rgba(217,70,239,1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out': {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(100%)', opacity: '0' },
        },
        'page-enter': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'modal-enter': {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
