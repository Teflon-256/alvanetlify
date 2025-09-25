import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './client/src/assets'),
      '@generated_images': path.resolve(__dirname, './client/src/generated_images'),
    },
  },
  build: {
    rollupOptions: {
      external: ['axios'],
    },
    outDir: '../dist/public',
    emptyOutDir: true,
    assetsInlineLimit: 0, // Ensure large assets are not inlined
  },
});
