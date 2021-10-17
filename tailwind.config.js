module.exports = {
  mode: 'jit',
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      width: {
        'fit': 'fit-content'
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
