import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://wniseries.ahaqqu.com',
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      // Three.js is a single lazy chunk loaded after the hero is useful; it is
      // expected to exceed Vite's generic 500 kB warning threshold.
      chunkSizeWarningLimit: 700,
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  },
  trailingSlash: 'ignore',
  server: {
    host: true,
  },
});
