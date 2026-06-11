// vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Remove console.* e debugger só no build de produção (dev fica intacto)
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
