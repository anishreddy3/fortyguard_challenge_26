import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    headers: {
      // Enable framing inside Autodesk Forma (https://app.autodeskforma.com)
      'Access-Control-Allow-Origin': '*',
      'Content-Security-Policy': "frame-ancestors 'self' https://*.autodeskforma.com https://*.autodeskforma.eu https://app.autodeskforma.com;",
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['motion'],
          lucide: ['lucide-react'],
        },
      },
    },
  },
});
