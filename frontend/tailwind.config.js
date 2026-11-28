/** @type {import('tailwindcss').Config} */

/* Цвет из переменной: rgb(var(--c-gray-100) / прозрачность).
   Значения переменных заданы в src/index.css отдельно для светлой и тёмной темы. */
const v = (name) => 'rgb(var(--c-' + name + ') / <alpha-value>)';

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

function scale(name) {
  const out = {};
  for (const s of SHADES) out[s] = v(name + '-' + s);
  return out;
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: v('white'),
        gray: scale('gray'),
        slate: scale('slate'),
        blue: scale('blue'),
        red: scale('red'),
        amber: scale('amber'),
        green: scale('green'),
      },
      /* Белый текст (например, на синей кнопке) всегда остаётся белым,
         даже когда фон «bg-white» в тёмной теме становится тёмным. */
      textColor: {
        white: '#ffffff',
      },
    },
  },
  plugins: [],
};
// конец файла tailwind.config.js
