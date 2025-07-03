import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // --- Adicione esta seção ---
  css: {
    postcss: './postcss.config.cjs', // Indica explicitamente para o Vite usar seu postcss.config.cjs
  },
  build: {
    cssMinify: 'cssnano', // Força o uso do cssnano para minificação de CSS
    // Você também pode tentar 'esbuild' aqui: cssMinify: 'esbuild',
    // Ou, para debug, desabilitar totalmente: cssMinify: false,
  },
  // --- Fim da seção adicionada ---
})