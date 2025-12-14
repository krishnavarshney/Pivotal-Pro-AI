import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {

    return {
        plugins: [
            react(),
        ],
        server: {
            proxy: {
                '/ollama-api': {
                    target: 'http://localhost:11434',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/ollama-api/, ''),
                },
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                }
            }
        },
    };
});
