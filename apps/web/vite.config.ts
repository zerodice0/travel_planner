import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '#src': path.resolve(__dirname, './src'),
      '#components': path.resolve(__dirname, './src/components'),
      '#pages': path.resolve(__dirname, './src/pages'),
      '#contexts': path.resolve(__dirname, './src/contexts'),
      '#hooks': path.resolve(__dirname, './src/hooks'),
      '#lib': path.resolve(__dirname, './src/lib'),
      '#types': path.resolve(__dirname, './src/types'),
      '#utils': path.resolve(__dirname, './src/utils'),
      '#constants': path.resolve(__dirname, './src/constants'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
