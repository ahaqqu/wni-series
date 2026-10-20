import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        station: 'station.html',
      },
    },
  },
  server: {
    host: '0.0.0.0',
  },
});
