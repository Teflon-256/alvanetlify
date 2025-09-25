import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'dist/public', // Point to dist/public for index.html
  build: {
    rollupOptions: {
      external: ['axios'],
    },
    outDir: 'dist/public', // Output build files to dist/public
  },
});
