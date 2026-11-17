/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FAF8F4',
          100: '#F4F1EA', // Warm Oat Gallery Canvas (Zero harsh white)
          200: '#EAE5DC', // Recessed Raw Linen
          300: '#DDD6CA',
          card: 'rgba(250, 248, 244, 0.78)',
        },
        ink: {
          50: '#F4F1EA',
          100: '#E6E2D8',
          200: '#CFC9BC',
          300: '#A8A296',
          400: '#8A8479',
          500: '#625D55',
          600: '#423F3A',
          700: '#262522',
          800: '#1B1A18', // Soft Velvet Carbon
          900: '#111110', // Film Darkroom Canvas
          950: '#0A0A09',
        },
        vermilion: {
          DEFAULT: '#9E6B52', // Warm Museum Terracotta-Bronze (replaces all purple!)
          light: '#C4937A',
          subtle: 'rgba(158, 107, 82, 0.12)',
        },
        morandi: {
          sage: '#B8C4B4',
          clay: '#D8BEB0',
          slate: '#B6C0C9',
          ochre: '#D9CBAF',
          plum: '#C6B8C3',
        },
        hairline: {
          light: 'rgba(28, 27, 25, 0.09)',
          dark: 'rgba(244, 241, 234, 0.09)',
        },
        primary: {
          50: '#F8F5F1',
          100: '#EFE9E1',
          200: '#DFD3C3',
          300: '#C8B49E',
          400: '#B29276',
          500: '#9E6B52',
          600: '#855640',
          700: '#6C4533',
          800: '#563729',
          900: '#442C22',
        },
        secondary: {
          50: '#F4F6F3',
          100: '#E6EBE4',
          200: '#CFD9CC',
          300: '#AFC0AA',
          400: '#8BA285',
          500: '#6C8466',
          600: '#556950',
          700: '#445440',
          800: '#374435',
          900: '#2E382C',
        },
        accent: {
          terracotta: '#9E6B52',
          gold: '#B89768',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Newsreader"', '"Playfair Display"', '"Songti SC"', '"Noto Serif SC"', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
      },
      boxShadow: {
        'editorial': '0 12px 40px -14px rgba(28, 25, 20, 0.07), 0 2px 8px -2px rgba(28, 25, 20, 0.03), inset 0 1px 0 0 rgba(255, 255, 255, 0.65)',
        'editorial-hover': '0 26px 60px -15px rgba(28, 25, 20, 0.14), 0 6px 18px -4px rgba(28, 25, 20, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        'editorial-float': '0 30px 75px -15px rgba(20, 18, 15, 0.24), 0 8px 24px -6px rgba(20, 18, 15, 0.08)',
        'dock': '0 20px 50px -10px rgba(20, 18, 15, 0.18), 0 4px 16px -2px rgba(20, 18, 15, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.75)',
        'soft': '0 14px 38px -10px rgba(28, 25, 20, 0.08)',
        'hover': '0 24px 54px -12px rgba(28, 25, 20, 0.15)',
      },
    },
  },
  plugins: [],
}
