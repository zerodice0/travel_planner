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
      '@convex': path.resolve(__dirname, '../../convex'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Production build optimizations
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          clerk: ['@clerk/clerk-react'],
          maps: ['@googlemaps/js-api-loader', '@googlemaps/markerclusterer'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 3001,
    host: true, // Listen on all addresses (0.0.0.0) for Railway
  },
});
