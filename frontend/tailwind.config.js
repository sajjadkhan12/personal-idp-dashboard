/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme
        'brand-primary': '#1e40af',
        'brand-secondary': '#3b82f6',
        'base-100': '#0f172a',
        'base-200': '#1e293b',
        'base-300': '#334155',
        'content': '#cbd5e1',

        // Light theme
        'lt-brand-primary': '#3b82f6',
        'lt-brand-secondary': '#60a5fa',
        'lt-base-100': '#f1f5f9',
        'lt-base-200': '#ffffff',
        'lt-base-300': '#e2e8f0',
        'lt-content': '#475569',
        'lt-content-strong': '#0f172a',
        'lt-content-subtle': '#64748b',
      }
    },
  },
  plugins: [],
  important: true,
}
