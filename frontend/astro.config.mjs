import { defineConfig } from 'astro/config';

const backend = process.env.BACKEND_URL || 'http://localhost:8080';

export default defineConfig({
  outDir: '../src/main/resources/static',
  build: { assets: '_astro', inlineStylesheets: 'auto' },
  server: { port: 4321 },
  vite: {
    server: { proxy: { '/api': { target: backend, changeOrigin: true } } }
  }
});
