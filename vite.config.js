import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// BASE_PATH is set by the GitHub Pages workflow:
//   "/"           when a custom domain (public/CNAME) is configured
//   "/<repo>/"    when served from https://<user>.github.io/<repo>/
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    // Older iPhones/iPads (iOS 13+) and Firefox ESR included, see browserslist.
    target: ['es2019', 'safari13', 'chrome80', 'firefox78', 'edge88'],
    cssTarget: ['safari13', 'chrome80', 'firefox78', 'edge88'],
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
