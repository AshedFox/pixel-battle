import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repo/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('radix-ui')) {
              return 'vendor-radix';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
