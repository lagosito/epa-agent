import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Medical blue palette
        medical: {
          50: '#E6F0FA',
          100: '#CCE0F5',
          200: '#99C2EB',
          300: '#66A3E0',
          400: '#3385D6',
          500: '#0066CC', // primary
          600: '#0052A3',
          700: '#003D7A',
          800: '#002952',
          900: '#001429',
        },
        accent: {
          DEFAULT: '#F4B942',
          warm: '#FFD089',
        },
        success: '#34A853',
        warning: '#F4B942',
        danger: '#C53030',
        bg: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#F1F4F8',
        },
        ink: {
          DEFAULT: '#0A1628',
          soft: '#1E3A5F',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        border: {
          DEFAULT: '#E0E6ED',
          strong: '#CBD5E0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
