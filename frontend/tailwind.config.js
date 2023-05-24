/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
    theme: {
      textColor: {
        "a" : "var(--color-a)",
        "b" : "var(--color-b)",
        "c" : "var(--color-c)",
        "d" : "var(--color-d)",
        "highlight-a": "var(--highlight-a)",
        "highlight-b": "var(--highlight-b)",
        "highlight-c": "var(--highlight-c)",
        "highlight-d": "var(--highlight-d)",
          ...colors
      },
      backgroundColor: {
        "a" : "var(--color-a)",
        "b" : "var(--color-b)",
        "c" : "var(--color-c)",
        "d" : "var(--color-d)",
        "highlight-a": "var(--highlight-a)",
        "highlight-b": "var(--highlight-b)",
        "highlight-c": "var(--highlight-c)",
        "highlight-d": "var(--highlight-d)",
          ...colors
      },
      borderColor: {
        "a" : "var(--color-a)",
        "b" : "var(--color-b)",
        "c" : "var(--color-c)",
        "d" : "var(--color-d)",
        "highlight-a": "var(--highlight-a)",
        "highlight-b": "var(--highlight-b)",
        "highlight-c": "var(--highlight-c)",
        "highlight-d": "var(--highlight-d)",
        ...colors
      },
      extend: {},
    },
  plugins: [],
}

