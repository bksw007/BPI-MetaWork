import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@components': path.resolve(__dirname, './src/components'),
          '@pages': path.resolve(__dirname, './src/pages'),
          '@services': path.resolve(__dirname, './src/services'),
          '@types': path.resolve(__dirname, './src/types'),
          '@utils': path.resolve(__dirname, './src/utils'),
          '@contexts': path.resolve(__dirname, './src/contexts'),
          '@config': path.resolve(__dirname, './src/config'),
        }
      }
    };
});
