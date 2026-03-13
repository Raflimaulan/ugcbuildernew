import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: {
    'process.env.API_KEY': JSON.stringify('api-key-this-is-not-used-can-be-ignored!'),
  },
  server: {
    proxy: {
      // Proxy /api ke backend supaya tidak kena CORS saat dev
      '/generate': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/jobs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api-proxy': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
