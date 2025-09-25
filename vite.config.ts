import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'client', // Set root to client/ where index.html is
  build: {
    rollupOptions: {
      external: ['axios'],
    },
    outDir: '../dist/public', // Output to dist/public relative to client/
    emptyOutDir: true, // Clear dist/public before building
  },
});
