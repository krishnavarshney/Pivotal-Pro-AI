import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI } from '@google/genai';
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

// Middleware to proxy Gemini API requests securely
const geminiProxy = (apiKey: string): Connect.HandleFunction => {
    const ai = new GoogleGenAI({ apiKey });

    return async (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
        }

        try {
            const body = await readJsonBody(req);
            const { model, ...restOfBody } = body;

            if (!model) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Model is required" }));
                return;
            }
            
            if (req.url === '/generateContentStream') {
                const result = await ai.models.generateContentStream({ model, ...restOfBody });
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                
                for await (const chunk of result) {
                    // Explicitly add the .text from the getter for client-side convenience
                    const chunkJson = {
                        ...JSON.parse(JSON.stringify(chunk)),
                        text: chunk.text,
                    };
                    res.write(`data: ${JSON.stringify(chunkJson)}\n\n`);
                }
                res.write('data: [DONE]\n\n');
                res.end();
            } else if (req.url === '/generateContent') {
                const result = await ai.models.generateContent({ model, ...restOfBody });
                 // Explicitly add the .text from the getter for client-side convenience
                const responseJson = {
                    ...JSON.parse(JSON.stringify(result)),
                    text: result.text,
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(responseJson));
            } else {
                next(); // Not our endpoint
            }
        } catch (error) {
            console.error("Gemini API Error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: errorMessage }));
        }
    };
};

const externalApiProxy = (): Connect.HandleFunction => {
    return async (req, res, next) => {
        if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
        }

        try {
            const { url, method = 'GET', headers = {}, body: requestBody = null } = await readJsonBody(req);
            
            if (!url) {
                res.statusCode = 400;
                res.end('URL is required');
                return;
            }
            
            const fetchOptions: any = {
                method,
                headers: {
                    ...headers,
                    // Avoid sending Vite's internal headers
                    'connection': undefined,
                    'host': undefined,
                },
            };
            
            if (requestBody && (method === 'POST' || method === 'PUT')) {
                fetchOptions.body = JSON.stringify(requestBody);
                headers['Content-Type'] = 'application/json';
            }

            const apiResponse = await fetch(url, fetchOptions);
            
            res.statusCode = apiResponse.status;
            res.setHeader('Content-Type', apiResponse.headers.get('Content-Type') || 'application/json');
            
            apiResponse.body.pipe(res);

        } catch (error) {
            console.error('API Proxy Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: (error as Error).message }));
        }
    };
};


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY || env.API_KEY;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY not found in .env file. AI features will be disabled.");
    }
    
    return {
      plugins: [
          react(),
          {
              name: 'custom-middlewares',
              configureServer(server: ViteDevServer) {
                  if (apiKey) {
                      server.middlewares.use('/api/gemini', geminiProxy(apiKey));
                  }
                  server.middlewares.use('/api/proxy', externalApiProxy());
              }
          }
      ],
      server: {
        proxy: {
          '/ollama-api': {
            target: 'http://localhost:11434',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ollama-api/, ''),
          }
        }
      },
      // API_KEY is no longer exposed to the client
    };
});