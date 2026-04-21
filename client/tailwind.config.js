/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'cat-security': '#ff3b3b',
        'cat-bugs': '#ffcc00',
        'cat-performance': '#3b82f6',
        'cat-style': '#a855f7',
        'grade-a': '#22c55e',
        'grade-b': '#84cc16',
        'grade-c': '#eab308',
        'grade-d': '#f97316',
        'grade-f': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'dot-pulse': 'dot-pulse 1.4s ease-in-out infinite',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'dot-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
