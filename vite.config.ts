import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Electron 30 bundles Chromium 124, so we can target esnext directly and skip
// the legacy transforms CRA's Babel preset emitted. base: './' keeps asset
// paths relative so the packaged main process can load build/index.html via
// file:// (see main.ts loadFile path).
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: 'build',
    target: 'esnext'
  },
  css: {
    // Use Sass's modern compiler API. Without this Vite falls back to the
    // legacy JS API, which prints a deprecation warning per .scss file on
    // every dev/build run.
    preprocessorOptions: {
      scss: { api: 'modern-compiler' }
    }
  },
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    open: false,
    port: 3000,
    strictPort: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts']
  }
});
