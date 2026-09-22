import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Твой apiUrl из кабинета GREEN-API.
        // Для другого кластера: GREEN_API_TARGET=https://4100.api.green-api.com npm run dev
        target: process.env.GREEN_API_TARGET || 'https://3100.api.green-api.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
