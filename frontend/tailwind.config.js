/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
    theme: {
      colors: {
        "a" : 'rgb(var(--color-a) / <alpha-value>)',
        "b" : 'rgb(var(--color-b) / <alpha-value>)',
        "c" : 'rgb(var(--color-c) / <alpha-value>)',
        "d" : 'rgb(var(--color-d) / <alpha-value>)',
        "highlight-a": 'rgb(var(--highlight-a) / <alpha-value>)',
        "highlight-b": 'rgb(var(--highlight-b) / <alpha-value>)',
        "highlight-c": 'rgb(var(--highlight-c) / <alpha-value>)',
        "highlight-d": 'rgb(var(--highlight-d) / <alpha-value>)',
          ...colors
      },
      // backgroundColor: {
      //   "a" : "var(--color-a)",
      //   "b" : "var(--color-b)",
      //   "c" : "var(--color-c)",
      //   "d" : "var(--color-d)",
      //   "highlight-a": "var(--highlight-a)",
      //   "highlight-b": "var(--highlight-b)",
      //   "highlight-c": "var(--highlight-c)",
      //   "highlight-d": "var(--highlight-d)",
      //     ...colors
      // },
      // borderColor: {
      //   "a" : "var(--color-a)",
      //   "b" : "var(--color-b)",
      //   "c" : "var(--color-c)",
      //   "d" : "var(--color-d)",
      //   "highlight-a": "var(--highlight-a)",
      //   "highlight-b": "var(--highlight-b)",
      //   "highlight-c": "var(--highlight-c)",
      //   "highlight-d": "var(--highlight-d)",
      //   ...colors
      // },
      extend: {},
    },
  plugins: [],
}

