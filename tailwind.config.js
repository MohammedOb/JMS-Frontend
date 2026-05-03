/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1d38',
          800: '#0f2548',
          700: '#163054',
          600: '#1e3f6e',
        },
        blue: {
          500: '#1d6bf3',
          400: '#3b82f6',
          300: '#60a5fa',
        },
        surface: '#f0f4f9',
        'surface-2': '#e8eef7',
        border: '#dce4ef',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0)   scale(1)'    },
        },
      },
      animation: {
        slideUp: 'slideUp 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
