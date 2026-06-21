import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    // Honor a PORT env override (used by the preview harness) so the
    // managed browser and the dev server agree on the port; default 5173.
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },

  build: {
    // Modern baseline — every browser we support runs es2022 (Chrome 94+,
    // Safari 15.4+, FF 93+). Stops esbuild down-levelling our own output.
    target: 'es2022',

    // Raise the warning threshold — vendor chunks are expected to be 500 KB+
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Split vendor libraries into stable, separately-cacheable chunks.
        // App code changes frequently; vendor code rarely does.
        manualChunks: {
          // Core React runtime — needed on every page, loads first
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-hot-toast'],
          // Supabase is large (~400 KB); split so it can be cached independently
          'vendor-supabase': ['@supabase/supabase-js'],
          // HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
  },
});
