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
        "chip-a1": 'rgb(var(--chip-a1) / <alpha-value>)',
        "chip-a2": 'rgb(var(--chip-a2) / <alpha-value>)',
        "chip-b1": 'rgb(var(--chip-b1) / <alpha-value>)',
        "chip-b2": 'rgb(var(--chip-b2) / <alpha-value>)',
          ...colors
      },
      extend: {
        animation: {
          cursor: 'cursor .6s linear infinite alternate',
          type: 'type 1.8s ease-out .8s 1 normal both',
          'type-reverse': 'type 1.8s ease-out 0s infinite alternate-reverse both',
        },
        keyframes: {
          type: {
            '0%': { width: '0ch' },
            '5%, 10%': { width: '1ch' },
            '15%, 20%': { width: '2ch' },
            '25%, 30%': { width: '3ch' },
            '35%, 40%': { width: '4ch' },
            '45%, 50%': { width: '5ch' },
            '55%, 60%': { width: '6ch' },
            '65%, 70%': { width: '7ch' },
            '75%, 80%': { width: '8ch' },
            '85%, 90%': { width: '9ch' },
            '95%': { width: '10ch' },
          },
        },
      },
    },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}

