import { defineConfig } from 'vite';
import cartographer from '@replit/vite-plugin-cartographer';
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cartographer(), runtimeErrorModal(), tailwindcss()],
  build: {
    rollupOptions: {
      external: ['axios']
    }
  }
});
