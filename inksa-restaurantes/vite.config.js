import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// A configuração do PostCSS foi movida para um arquivo separado (postcss.config.js)
// para garantir a máxima compatibilidade.
export default defineConfig({
  plugins: [react()],
})
