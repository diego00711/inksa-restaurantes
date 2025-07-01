import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Importe 'path' para resolver caminhos absolutos

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Garante que '@/' aponte para o diretório 'src'
      "@": path.resolve(__dirname, "./src"),
    },
  },
})