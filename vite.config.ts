import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@server': path.resolve(import.meta.dirname, 'server'),
      '@tests': path.resolve(import.meta.dirname, 'tests'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for large third-party libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
          ],
          // Form handling chunk
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Charts and data visualization
          charts: ['recharts', 'date-fns'],
          // Utils and smaller libraries
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // Set chunk size warning limit to 800KB
    chunkSizeWarningLimit: 800,
    // Enable source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
  },
  server: {
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    allowedHosts: ['healthcheck.railway.app'],
  },
  preview: {
    allowedHosts: ['healthcheck.railway.app'],
  },
});
