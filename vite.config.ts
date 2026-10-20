import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          user: path.resolve(__dirname, 'user.html'),
          admin: path.resolve(__dirname, 'admin.html'),
          develover: path.resolve(__dirname, 'develover.html'),
          promt: path.resolve(__dirname, 'promt.html'),
        },
      },
    },
  };
});
