/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pizza Theme Colors
        tomato: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // Main Tomato Red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        mozzarella: {
          50: '#ffffff',
          100: '#fefefe',
          200: '#fdfbf7', // Fresh Mozzarella
          300: '#faf8f3',
          400: '#f5f2eb',
          500: '#efeadd',
        },
        basil: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // Fresh Basil Green
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        crust: {
          50: '#fefcf3',
          100: '#fdf6e3',
          200: '#faebc8',
          300: '#f5d89a',
          400: '#edc06a',
          500: '#e5a84a',
          600: '#d4892e', // Golden Crust
          700: '#b06d23',
          800: '#8f5621',
          900: '#74461e',
        },
        wood: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524', // Wood-fired Oven Dark
          900: '#1c1917',
        },
        // Legacy brand colors for backward compatibility
        brand: {
          dark: '#ffffff',
          card: '#f8fafc',
          gold: '#d4892e', // Updated to crust color
          cream: '#44403c',
        },
        // Legacy burger colors
        burger: {
          dark: '#0a0a0a',
          warm: '#1a1a1a',
          accent: '#d4892e',
          gold: '#d4892e',
          cream: '#f9f9f9',
          patty: '#262626',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Pizza dough texture pattern
        'pizza-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4892e' fill-opacity='0.05'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3Ccircle cx='20' cy='40' r='1.5'/%3E%3Ccircle cx='40' cy='20' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        // Tomato sauce gradient
        'tomato-gradient': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
        // Crust gradient
        'crust-gradient': 'linear-gradient(135deg, #f5d89a 0%, #e5a84a 50%, #d4892e 100%)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(220, 38, 38, 0.15)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'warm': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'pizza': '0 8px 32px rgba(220, 38, 38, 0.12)',
        'crust': '0 4px 16px rgba(212, 137, 46, 0.2)',
      },
      borderRadius: {
        'pizza': '50%',
        'slice': '0 100% 0 100%',
      },
    },
  },
  plugins: [],
}
