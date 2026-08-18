/** @type {import('tailwindcss').Config} */
// Tailwind is scoped to the integrated Reports module only. Preflight (base
// reset) is intentionally disabled in src/styles.scss so the rest of the app
// (which is not built with Tailwind) is completely unaffected — only the
// explicit utility classes used inside the Reports templates are generated
// and applied.
module.exports = {
  content: [
    "./src/app/pages/reports/**/*.{html,ts}",
    "./src/app/shared/reports/**/*.{html,ts}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'enterprise-navy': '#0f172a',
        'enterprise-blue': '#2563eb',
        'enterprise-surface': '#F8FAFC',
        'enterprise-border': '#E5E7EB',
        'enterprise-success-bg': '#f0fdf4',
        'enterprise-success-text': '#166534',
        'enterprise-pending-bg': '#fffbeb',
        'enterprise-pending-text': '#b45309',
        'enterprise-rejected-bg': '#fef2f2',
        'enterprise-rejected-text': '#b91c1c',
      },
      borderRadius: {
        'custom': '12px',
      }
    },
  },
  plugins: [],
}
