/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef7ff',
                    100: '#d9ecff',
                    200: '#bcdfff',
                    300: '#8ecdff',
                    400: '#59b0ff',
                    500: '#338dfc',
                    600: '#1d6ef1',
                    700: '#1558de',
                    800: '#1848b4',
                    900: '#1a3f8e',
                    950: '#152856',
                },
                accent: {
                    50: '#f0fdf6',
                    100: '#dcfce9',
                    200: '#bbf7d4',
                    300: '#86efb0',
                    400: '#4ade84',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                dental: {
                    teal: '#0d9488',
                    sky: '#0ea5e9',
                    violet: '#8b5cf6',
                    rose: '#f43f5e',
                    amber: '#f59e0b',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                glow: '0 0 20px rgba(51, 141, 252, 0.15)',
                card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
                slideInRight: { '0%': { transform: 'translateX(20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
            },
        },
    },
    plugins: [],
};
