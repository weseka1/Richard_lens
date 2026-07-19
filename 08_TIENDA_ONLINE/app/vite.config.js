import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev: la app corre en 5173 y le pega a la API local en 5250
// build: cae en ../dist y server.js la sirve entera
export default defineConfig({
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    proxy: {
      '/api': 'http://localhost:5250',
      '/fotos': 'http://localhost:5250'
    }
  }
});
