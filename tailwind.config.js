/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══ PREMIUM WHITE PALETTE ═══
        noir: {
          950: '#FAFAF8',  // Light cream bg
          900: '#F5F3EF',  // Slightly warm
          850: '#FFFFFF',  // Pure white surface
          800: '#F0EDE7',  // Soft warm gray
          700: '#E8E3DB',  // Subtle border / card hover
          600: '#D4CFC5',  // Muted accents
          500: '#B8B0A3',  // Disabled, placeholder
        },
        ember: {
          50: '#FEF3EC',
          100: '#FDE3D0',
          200: '#FBC4A0',
          300: '#F8A06B',
          400: '#E5753A',
          500: '#C1440E', // Primary accent
          600: '#A33A0C',
          700: '#85300A',
          800: '#6B2708',
          900: '#501D06',
        },
        gold: {
          50: '#FDF8ED',
          100: '#FAEFD2',
          200: '#F4DDA5',
          300: '#ECC976',
          400: '#D4922A', // Secondary accent
          500: '#C28420',
          600: '#A16D18',
          700: '#7F5613',
          800: '#5E400E',
          900: '#3D2A09',
        },
        parchment: {
          50: '#FFFFFF',
          100: '#FAF7F1',
          200: '#1A1410',  // Text primary (dark)
          300: '#2A2520',
          400: '#45403A',
          500: '#5C554E',
          600: '#7A7068',
          700: '#9B8D74',  // Text muted
          800: '#B8AA8F',
          900: '#D4C9B0',
        },
        // Backward compatibility
        tomato: {
          50: '#FEF3EC',
          100: '#FDE3D0',
          200: '#FBC4A0',
          300: '#F8A06B',
          400: '#E5753A',
          500: '#C1440E',
          600: '#C1440E',
          700: '#A33A0C',
          800: '#85300A',
          900: '#6B2708',
        },
        wood: {
          50: '#FAF7F2',
          100: '#F0EBE0',
          200: '#DDD5C5',
          300: '#C4B9A3',
          400: '#9B8D74',
          500: '#7A7068',
          600: '#5C554E',
          700: '#3D3630',
          800: '#2A2420',
          900: '#1A1410',
        },
        mozzarella: {
          50: '#FAFAF8',
          100: '#F5F3EF',
          200: '#FFFFFF',
          300: '#F0EDE7',
          400: '#E8E3DB',
          500: '#D4CFC5',
        },
        basil: {
          50: '#FDF8ED',
          100: '#FAEFD2',
          200: '#F4DDA5',
          300: '#ECC976',
          400: '#D4922A',
          500: '#C28420',
          600: '#A16D18',
          700: '#7F5613',
          800: '#5E400E',
          900: '#3D2A09',
        },
        crust: {
          50: '#FEF3EC',
          100: '#E8E3DB',
          200: '#DDD5C5',
          300: '#D4CFC5',
          400: '#B8AA8F',
          500: '#D4922A',
          600: '#C1440E',
          700: '#85300A',
          800: '#5E400E',
          900: '#3D2A09',
        },
        brand: {
          dark: '#1A1410',
          card: '#FFFFFF',
          gold: '#D4922A',
          cream: '#FAFAF8',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sub: ['"Libre Baskerville"', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        marquee: ['"Bebas Neue"', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'ember-pulse': 'emberPulse 2s ease-in-out infinite',
        'draw-underline': 'drawUnderline 0.3s ease forwards',
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
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        emberPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(193,68,14,0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(193,68,14,0.25)' },
        },
        drawUnderline: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ember-glow': 'radial-gradient(ellipse at bottom left, rgba(193,68,14,0.06) 0%, transparent 60%)',
        'gold-glow': 'radial-gradient(ellipse at top right, rgba(212,146,42,0.04) 0%, transparent 50%)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(193,68,14,0.08)',
        'ember': '0 4px 20px rgba(193,68,14,0.12)',
        'ember-lg': '0 8px 40px rgba(193,68,14,0.15)',
        'gold': '0 4px 20px rgba(212,146,42,0.1)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.08)',
        'warm': '0 4px 16px rgba(0,0,0,0.06)',
        'pizza': '0 8px 32px rgba(193,68,14,0.08)',
        'crust': '0 4px 16px rgba(212,146,42,0.08)',
      },
      borderRadius: {
        'pizza': '50%',
        'slice': '0 100% 0 100%',
      },
      borderColor: {
        'noir-border': 'rgba(26, 20, 16, 0.08)',
      },
    },
  },
  plugins: [],
}
