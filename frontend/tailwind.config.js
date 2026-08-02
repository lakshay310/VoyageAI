// tailwind.config.js
// Tells Tailwind which files to scan for class names.
// Only classes found in these files will be included in the final CSS build.

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',  // scan all JS and JSX files in src/
  ],
  theme: {
    extend: {
      // Custom colours for the app's design system
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
