import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'), // Map @ to client/src/
    },
  },
  build: {
    rollupOptions: {
      external: ['axios'],
    },
    outDir: '../dist/public',
    emptyOutDir: true,
  },
});
