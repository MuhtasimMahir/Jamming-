import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Spotify no longer allows "localhost" as a redirect URI host (only exact
    // loopback literals). Running the dev server on 127.0.0.1 means the URL
    // you register in the Spotify dashboard matches what you actually run.
    host: '127.0.0.1',
    port: 5173,
  },
});
