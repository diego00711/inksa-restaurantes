import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Configura o atalho '@' para apontar para a pasta 'src'
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
