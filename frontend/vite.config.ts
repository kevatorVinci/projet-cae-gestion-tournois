// eslint-disable-next-line spaced-comment
/// <reference types="vitest/config" />

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiTarget = env.VITE_API_TARGET || 'http://localhost:3000';

  return {
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        './tests/**', // 👈 This targets only your root tests folder
      ],
      coverage: {
        reporter: ['text', 'html'],
        thresholds: {
          statements: 20,
          branches: 30,
          functions: 10,
          lines: 20,
        },
      },
    },

    plugins: [
      react(),
      checker({
        typescript: true,
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
