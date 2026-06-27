import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Dev-only bundle analysis. Off by default — set ANALYZE=1 to emit
    // dist/stats.html (treemap of chunk contents). Never affects normal builds.
    process.env.ANALYZE &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, template: process.env.ANALYZE_JSON ? 'raw-data' : 'treemap' }),
  ].filter(Boolean),

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
