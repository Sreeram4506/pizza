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
          950: '#F6F1E8',  // Light cream bg
          900: '#F0E8DB',  // Slightly warm
          850: '#FFFFFF',  // Pure white surface
          800: '#E9E1D4',  // Soft warm gray
          700: '#DDD5C8',  // Subtle border / card hover
          600: '#C8BDAF',  // Muted accents
          500: '#AFA392',  // Disabled, placeholder
        },
        ember: {
          50: '#FFF7F2',
          100: '#FBE7DD',
          200: '#F2C9B2',
          300: '#E8A57E',
          400: '#D57F54',
          500: '#C46A3B', // Terracotta primary
          600: '#B35B33',
          700: '#9A4E2B',
          800: '#7E3F22',
          900: '#5F3019',
        },
        gold: {
          50: '#F7F8F1',
          100: '#EDF0E3',
          200: '#DDE3CA',
          300: '#C2CBAC',
          400: '#9AA87E',
          500: '#7D8C5F', // Olive accent
          600: '#68744F',
          700: '#525E41',
          800: '#3E472F',
          900: '#2A3321',
        },
        parchment: {
          50: '#FFFFFF',
          100: '#FFFCF7',
          200: '#1D1813',  // Text primary (dark)
          300: '#2E2923',
          400: '#474039',
          500: '#5D554C',
          600: '#756A5F',
          700: '#8B8174',  // Text muted
          800: '#A89D91',
          900: '#C6BBAE',
        },
        // Backward compatibility
        tomato: {
          50: '#FFF3EC',
          100: '#F9E0D5',
          200: '#F1C3AB',
          300: '#E79671',
          400: '#CC6D43',
          500: '#A24A28',
          600: '#A24A28',
          700: '#8E3F20',
          800: '#743319',
          900: '#5B2714',
        },
        wood: {
          50: '#FAF6F0',
          100: '#EFE7DA',
          200: '#DCCEB8',
          300: '#C3B090',
          400: '#8B8174',
          500: '#756A5F',
          600: '#5D554C',
          700: '#433C36',
          800: '#2E2923',
          900: '#1D1813',
        },
        mozzarella: {
          50: '#FFFDF8',
          100: '#F6F1E8',
          200: '#FFFFFF',
          300: '#EEE5D8',
          400: '#E1D6C7',
          500: '#CFC2B0',
        },
        basil: {
          50: '#FBF7EE',
          100: '#EFE5CE',
          200: '#DDC896',
          300: '#C9AD67',
          400: '#8B7A4E',
          500: '#7A6942',
          600: '#665734',
          700: '#504423',
          800: '#3B3118',
          900: '#271F0D',
        },
        crust: {
          50: '#FFF3EC',
          100: '#EDE2D3',
          200: '#DDCBB4',
          300: '#CBB393',
          400: '#A58D6D',
          500: '#8B7A4E',
          600: '#A24A28',
          700: '#743319',
          800: '#504423',
          900: '#271F0D',
        },
        brand: {
          dark: '#1D1813',
          card: '#FFFDF8',
          gold: '#7D8C5F',
          cream: '#F7F1EA',
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', '"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sub: ['"Segoe UI"', '"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['"Segoe UI"', '"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"SFMono-Regular"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
        marquee: ['"Segoe UI"', '"Inter"', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'serif-1947': ['"Playfair Display"', 'Georgia', 'serif'],
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
