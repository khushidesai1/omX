/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        'brand-primary': 'var(--color-brand-primary)',
        'brand-primary-dark': 'var(--color-brand-primary-dark)',
        'brand-text': 'var(--color-brand-text)',
        'brand-body': 'var(--color-brand-body)',
        'brand-muted': 'var(--color-brand-muted)',
      },
    },
  },
  plugins: [],
}
