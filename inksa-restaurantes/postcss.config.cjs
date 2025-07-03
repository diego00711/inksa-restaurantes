module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    cssnano: {} // Garanta que cssnano esteja aqui também, caso não use a configuração do build em Vite
  },
};