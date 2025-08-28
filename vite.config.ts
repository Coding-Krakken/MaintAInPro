import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

const apiTarget = process.env.API_TARGET || 'http://localhost:5000';

// Detect GitHub.dev environment
const isGitHubDev = process.env.CODESPACE_NAME || process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const backendUrl = isGitHubDev
  ? `https://${process.env.CODESPACE_NAME}-5000.app.github.dev`
  : apiTarget;

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
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
          ],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          charts: ['recharts', 'date-fns'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,
  },
  server: {
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    allowedHosts: ['localhost', '.github.dev', 'crispy-enigma-wr4qw9w7xvjqf9q7-4173.app.github.dev'],
    cors: true,
    host: true,
    hmr: {
      port: 4173,
      host: isGitHubDev ? 'localhost' : undefined,
      protocol: isGitHubDev ? 'ws' : undefined,
    },
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        configure: (proxy, _options) => {
          // Handle GitHub.dev environment
          if (isGitHubDev) {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error in GitHub.dev:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Remove headers that might cause issues in GitHub.dev
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              console.log('Proxying request to:', backendUrl, 'for path:', req.url);
            });
          }
        },
      },
    },
  },
  preview: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
