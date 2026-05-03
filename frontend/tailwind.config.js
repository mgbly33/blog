/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Renaissance 2.0 color palette
        primary: {
          50: '#fdf2f3',
          100: '#fce4e6',
          200: '#f9cdd1',
          300: '#f4a8ae',
          400: '#ec7b84',
          500: '#E8B4B8',  // Main primary - 柔粉色
          600: '#d4989c',
          700: '#b27b7f',
          800: '#956569',
          900: '#7d575a',
        },
        secondary: {
          50: '#f4f7f5',
          100: '#e6ede8',
          200: '#cedcd2',
          300: '#A9BDAD',  // Main secondary - 鼠尾草绿
          400: '#8ba591',
          500: '#6b8b72',
          600: '#546f5a',
          700: '#445949',
          800: '#39493d',
          900: '#303d33',
        },
        accent: {
          gold: '#C5A059',  // 复古金
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Montserrat', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 10px 40px rgba(74, 44, 42, 0.08)',
        'hover': '0 20px 60px rgba(74, 44, 42, 0.12)',
      },
    },
  },
  plugins: [],
}
