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
