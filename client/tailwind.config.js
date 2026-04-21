/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0f1419',
        'bg-card': '#1a2028',
        'bg-elevated': '#212832',
        'border-subtle': '#2a323d',
        'accent': '#5eead4',
        'severity-critical': '#ef4444',
        'severity-high': '#f97316',
        'severity-medium': '#eab308',
        'severity-low': '#3b82f6',
        'severity-info': '#6b7280',
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'ring-fill': 'ring-fill 1.5s ease-out forwards',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
