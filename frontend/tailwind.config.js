export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: { DEFAULT: '#2563EB', dark: '#1E40AF' },
                success: '#10B981',
                error: '#EF4444',
                warning: '#F59E0B',
                neutral: '#E5E7EB',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
