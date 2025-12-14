import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// FIX: Corrected import to align with new SDK guidelines.
import { GoogleGenAI } from "@google/genai";
import type { Connect, ViteDevServer } from 'vite';
import type { ServerResponse } from 'http';
import fetch from 'node-fetch';


// Helper to parse JSON body
async function readJsonBody(req: Connect.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}')); // Handle empty body
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

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
