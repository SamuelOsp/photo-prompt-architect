import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DEV_PORT = 3001;
const IS_DEV = process.env.NODE_ENV !== 'production';

// Initialize Gemini Client
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// In development mode, start ng serve on DEV_PORT in the background
if (IS_DEV) {
  console.log(`Starting Angular Dev Server on port ${DEV_PORT}...`);
  const ngProcess = spawn('npx', ['ng', 'serve', '--port', String(DEV_PORT)], {
    stdio: 'inherit',
    shell: true
  });

  ngProcess.on('error', (err) => {
    console.error('Failed to start Angular Dev Server:', err);
  });

  ngProcess.on('exit', (code) => {
    console.log(`Angular Dev Server exited with code ${code}`);
  });
}

function handleProxy(req: http.IncomingMessage, res: http.ServerResponse) {
  const headers = { ...req.headers, host: `127.0.0.1:${DEV_PORT}` };

  const options: http.RequestOptions = {
    host: '127.0.0.1',
    port: DEV_PORT,
    path: req.url,
    method: req.method,
    headers: headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  req.pipe(proxyReq);

  proxyReq.on('error', (err) => {
    console.error('Proxy Error (Dev server starting up):', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="2">
            <title>Loading Application...</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
              .card { text-align: center; padding: 2rem; background: #1e293b; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
              .spinner { width: 36px; height: 36px; border: 3px solid #334155; border-top-color: #38bdf8; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="spinner"></div>
              <h2>Compiling Application...</h2>
              <p style="color: #94a3b8; font-size: 0.9rem;">Connecting to dev server, auto-refreshing in 2s...</p>
            </div>
          </body>
        </html>
      `);
    }
  });
}

const server = http.createServer(async (req, res) => {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route: /api/analyze
  if (req.url === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { base64Image, mimeType } = JSON.parse(body);
        if (!base64Image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing base64Image' }));
          return;
        }

        const base64Data = base64Image.split(',')[1] || base64Image;
        const prompt = `
Role: You are an expert AI prompt engineer.
Task: Analyze the uploaded image and generate a text prompt that describes it in high detail.

The output must be a text description in the following specific format:

Subject : [blank]
The most real and human possible, create an image that looks like a casual portrait taken by someone else using an iPhone back camera, not a posed shoot but a spontaneous, everyday snapshot. The subject keeps the exact outfit and accessories from the reference image, with no changes or stylization. The posture, body position, and gesture should match the reference naturally, including relaxed shoulders, natural limb placement, and an unforced stance consistent with a quick handheld capture.

The environment closely matches the reference photo, including the same type of location, surrounding objects, surfaces, background elements, and spatial depth. All materials show realistic texture: fabric weave, skin texture, worn surfaces, subtle dust, scuffs, fingerprints, and everyday imperfections. Nothing looks polished or staged.

Lighting is natural and believable for the scene, whether indoor or outdoor, with realistic falloff, uneven exposure, and mild sensor noise. Highlights may clip slightly, shadows may retain grain, and white balance should feel neutral and true to life, not too warm and not too cool. No color grading, no cinematic look, no stylization.

There should be no clear subject or intentional composition, just a casual, unintentional snapshot. Framing is slightly off-center and imperfect, possibly a little crooked, as if taken quickly by another person. The background must be fully sharp and in focus, with no bokeh, no depth-of-field effect, and no portrait mode.

Camera behavior should feel authentic to an iPhone back camera, approximately 24–26mm equivalent, f/1.8, ISO 100–400, with natural motion blur where appropriate from small movements. The image must not look AI-generated, but like a real photo taken in the moment.

Do not change Subject’s facial features.
Subjects must look 1000% identical to uploaded images.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg'
              }
            }
          ],
          config: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
            ]
          }
        });

        const generatedText = response.text || '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: generatedText }));
      } catch (err: any) {
        console.error('Server-side Gemini Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Error occurred on server while analyzing image' }));
      }
    });
    return;
  }

  // Development Proxy Router
  if (IS_DEV) {
    handleProxy(req, res);
  } else {
    // Serve Static Files for Production Mode
    let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url || 'index.html');
    
    // Check if path is valid or needs SPA fallback
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        filePath = path.join(__dirname, 'dist', 'index.html');
      }

      const ext = path.extname(filePath);
      let contentType = 'text/html';
      if (ext === '.js' || ext === '.mjs') contentType = 'application/javascript';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.ico') contentType = 'image/x-icon';

      fs.readFile(filePath, (readFileErr, content) => {
        if (readFileErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Unified Full-Stack Server listening on http://0.0.0.0:${PORT} [Mode: ${IS_DEV ? 'Development' : 'Production'}]`);
});
