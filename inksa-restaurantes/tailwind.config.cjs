/** @type {import('tailwindcss').Config} */
module.exports = {
  // A configuração do 'content' é a mais importante.
  // Ela diz ao Tailwind para olhar o index.html e todos os arquivos .jsx e .tsx dentro da pasta src.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {}, // Deixamos o tema vazio por enquanto para simplificar.
  },
  plugins: [], // E também os plugins.
}
