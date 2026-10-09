'use strict';

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind v3 config — the styles/index.css uses Tailwind v4 CSS-first syntax.
  // If you run v3, use this config; if you run v4 (pnpm add tailwindcss@next),
  // this file is ignored and @theme in index.css takes precedence.
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Generates font-heading utility (use class="font-heading")
        heading: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        neon: {
          pink:    '#d946ef',
          purple:  '#8b5cf6',
          indigo:  '#6366f1',
          // legacy aliases
          cyan:    '#818cf8',
          magenta: '#d946ef',
        },
        brand: {
          pink:   '#d946ef',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          deep:   '#6d28d9',
        },
        dark: {
          bg:     '#07091a',
          card:   '#0d1229',
          surface:'#131d3a',
          border: '#1e2a4a',
        },
      },
    },
  },
  plugins: [],
};
