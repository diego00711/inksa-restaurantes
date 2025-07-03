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
  css: {
    postcss: './postcss.config.cjs', // Indica explicitamente para o Vite usar seu postcss.config.cjs
  },
  build: {
    cssMinify: 'cssnano', // Ou 'esbuild', se preferir
  },
})