import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import path from 'path';
import process from 'process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
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
          target: env.VITE_API_URL,
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
  };
});
