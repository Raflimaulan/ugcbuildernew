
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import 'dotenv/config';
import express from 'express';
import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';


const app = express();
app.use(express.json({limit: process?.env?.API_PAYLOAD_MAX_SIZE || "7mb"}));

const PORT = process?.env?.API_BACKEND_PORT || 5000;
const API_BACKEND_HOST = process?.env?.API_BACKEND_HOST || "127.0.0.1";

const GOOGLE_CLOUD_LOCATION = process?.env?.GOOGLE_CLOUD_LOCATION;
const GOOGLE_CLOUD_PROJECT = process?.env?.GOOGLE_CLOUD_PROJECT;
if (!GOOGLE_CLOUD_PROJECT || !GOOGLE_CLOUD_LOCATION) {
  console.error("Error: Environment variables GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set.");
  process.exit(1);
}
const PROXY_HEADER = process?.env?.PROXY_HEADER;
if (!PROXY_HEADER) {
  console.error("Error: Environment variables PROXY_HEADER must be set.");
  process.exit(1);
}

app.set('trust proxy', 1 /* number of proxies between user and server */);

// IMPORTANT: Vertex AI Studio Rate Limiting
// This rate limiting configuration protects your backend APIs from abuse.
// Removing it exposes your service to DoS attacks and unexpected costs.
const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Set ratelimit window at 15min (in ms)
    max: 100, // Limit each IP to 100 requests per window 
    standardHeaders: true, // Return rate limit info in the "RateLimit-*" headers
    legacyHeaders: false, // no "X-RateLimit-*" headers
    message: {
      error: 'Too many requests',
      message: 'You have exceed the request limit, please try again later.'
    },
});
// Apply the rate limiter to the /api-proxy route before the main proxy logic
app.use('/api-proxy', proxyLimiter);

const API_CLIENT_MAP = [
 {
    name: "VertexGenAi:generateContent",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:generateContent",
    getApiEndpoint: (context, params) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:generateContent`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "VertexGenAi:predict",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:predict",
    getApiEndpoint: (context, params) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:predict`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "VertexGenAi:streamGenerateContent",
    patternForProxy: "https://aiplatform.googleapis.com/{{version}}/publishers/google/models/{{model}}:streamGenerateContent",
    getApiEndpoint: (context, params) => {
      return `https://aiplatform.clients6.google.com/${params['version']}/projects/${context.projectId}/locations/${context.region}/publishers/google/models/${params['model']}:streamGenerateContent`;
    },
    isStreaming: true,
    transformFn: (response) => {
        let normalizedResponse = response.trim();
        while (normalizedResponse.startsWith(',') || normalizedResponse.startsWith('[')) {
          normalizedResponse = normalizedResponse.substring(1).trim();
        }
        while (normalizedResponse.endsWith(',') || normalizedResponse.endsWith(']')) {
          normalizedResponse = normalizedResponse.substring(0, normalizedResponse.length - 1).trim();
        }

        if (!normalizedResponse.length) {
          return {result: null, inProgress: false};
        }

        if (!normalizedResponse.endsWith('}')) {
          return {result: normalizedResponse, inProgress: true};
        }

        try {
          const parsedResponse = JSON.parse(`${normalizedResponse}`);
          const transformedResponse = `data: ${JSON.stringify(parsedResponse)}\n\n`;
          return {result: transformedResponse, inProgress: false};
        } catch (error) {
          throw new Error(`Failed to parse response: ${error}.`);
        }
    },
  },
 {
    name: "ReasoningEngine:query",
    patternForProxy: "https://{{endpoint_location}}-aiplatform.googleapis.com/{{version}}/projects/{{project_id}}/locations/{{location_id}}/reasoningEngines/{{engine_id}}:query",
    getApiEndpoint: (context, params) => {
      return `https://${params['endpoint_location']}-aiplatform.clients6.google.com/v1beta1/projects/${params['project_id']}/locations/${params['location_id']}/reasoningEngines/${params['engine_id']}:query`;
    },
    isStreaming: false,
    transformFn: null,
  },
 {
    name: "ReasoningEngine:streamQuery",
    patternForProxy: "https://{{endpoint_location}}-aiplatform.googleapis.com/{{version}}/projects/{{project_id}}/locations/{{location_id}}/reasoningEngines/{{engine_id}}:streamQuery",
    getApiEndpoint: (context, params) => {
      return `https://${params['endpoint_location']}-aiplatform.clients6.google.com/v1beta1/projects/${params['project_id']}/locations/${params['location_id']}/reasoningEngines/${params['engine_id']}:streamQuery`;
    },
    isStreaming: true,
    transformFn: null,
  },
].map((client) => ({ ...client, patternInfo: parsePattern(client.patternForProxy) }));

// Uses Google Application Default Credentials (ADC).
// Users need to run "gcloud auth application-default login" in order to use the proxy.
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePattern(pattern) {
  const paramRegex = /\{\{(.*?)\}\}/g;
  const params = [];
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = paramRegex.exec(pattern)) !== null) {
    params.push(match[1]);
    const literalPart = pattern.substring(lastIndex, match.index);
    parts.push(escapeRegex(literalPart));
    parts.push(`(?<${match[1]}>[^/]+)`);
    lastIndex = paramRegex.lastIndex;
  }
  parts.push(escapeRegex(pattern.substring(lastIndex)));
  const regexString = parts.join('');

  return {regex: new RegExp(`^${regexString}$`), params};
}

function extractParams(patternInfo, url) {
  const match = url.match(patternInfo.regex);
  if (!match) return null;
  const params = {};
  patternInfo.params.forEach((paramName, index) => {
    params[paramName] = match[index + 1];
  });
  return params;
}

async function getAccessToken(res) {
  try {
    const authClient = await auth.getClient();
    const token = await authClient.getAccessToken();
    return token.token;
  } catch (error) {
    console.error('[Node Proxy] Authentication error:', error);
    if (!res) return null;
    if (error.code === 'ERR_GCLOUD_NOT_LOGGED_IN' || (error.message && error.message.includes('Could not load the default credentials'))) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'Google Cloud Application Default Credentials not found or invalid. Please run "gcloud auth application-default login" and try again.',
      });
    } else {
      res.status(500).json({ error: `Authentication failed: ${error.message}` });
    }
    return null;
  }
}

function getRequestHeaders(accessToken) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'X-Goog-User-Project': GOOGLE_CLOUD_PROJECT,
    'Content-Type': 'application/json',
  };
}

// --- Proxy Endpoint ---
app.post('/api-proxy', async (req, res) => {

  // Check for the custom header added by the shim
  if (req.headers['x-app-proxy'] !== PROXY_HEADER) {
    return res.status(403).send('Forbidden: Request must originate from the Vertex App shim.');
  }

  const { originalUrl, method, headers, body } = req.body;
  if (!originalUrl) {
    return res.status(400).send('Bad Request: originalUrl is required.');
  }

  // 1. Find the matching API client
  const apiClient = API_CLIENT_MAP.find(p => {
    // We store extractedParams on req for use later if needed, though getVertexUrl takes it as arg.
    req.extractedParams = extractParams(p.patternInfo, originalUrl);
    return req.extractedParams !== null;
  });

  if (!apiClient) {
    console.error(`[Node Proxy] No API client handler found for URL: ${originalUrl}`);
    return res.status(404).json({ error: `No proxy handler found for URL: ${originalUrl}` });
  }

  const extractedParams = req.extractedParams;
  console.log(`[Node Proxy] Matched API client: ${apiClient.name}`);
  try {
    // 2. Get authenticated access token
    const accessToken = await getAccessToken(res);
    if (!accessToken) return;

    // 3. Construct the full API URL using env-set GOOGLE_CLOUD_PROJECT/LOCATION and extracted params
    const context = {projectId: GOOGLE_CLOUD_PROJECT, region: GOOGLE_CLOUD_LOCATION};
    const apiUrl = apiClient.getApiEndpoint(context, extractedParams);
    console.log(`[Node Proxy] Forwarding to Vertex API: ${apiUrl}`);

    // 4. Prepare headers for the API call
    const apiHeaders = getRequestHeaders(accessToken);

    const apiFetchOptions = {
      method: method || 'POST',
      headers: {...apiHeaders, ...headers},
      body: body ? body : undefined,
    };

    // 5. Make the call to the API
    const apiResponse = await fetch(apiUrl, apiFetchOptions);

    // 6. Respond to the client based on stream type
    if (apiClient.isStreaming) {
      console.log(`[Node Proxy] Sending STREAMING response for ${apiClient.name}`);
      // Set headers for a streaming JSON response
      res.writeHead(apiResponse.status, {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
      });
      // Immediately send headers
      res.flushHeaders();

      if (!apiResponse.body) {
        console.error('[Node Proxy] Streaming response has no body.');
        return res.end(JSON.stringify({ error: 'Streaming response body is null' }));
      }

      const decoder = new TextDecoder();
      let deltaChunk = '';
      apiResponse.body.on('data', (encodedChunk) => {
        if (res.writableEnded) return; // Prevent writing after res.end()

        try {
          if (!apiClient.transformFn) {
            res.write(encodedChunk);
          } else {
            const decodedChunk = decoder.decode(encodedChunk, { stream: true });
            deltaChunk = deltaChunk + decodedChunk;

            const {result, inProgress} = apiClient.transformFn(deltaChunk);
            if (result && !inProgress) {
              deltaChunk = '';
              res.write(new TextEncoder().encode(result));
            }
          }
        } catch (error) {
          console.error(`[Node Proxy] Error processing streaming response for ${apiClient.name}`);
          console.error(error);
        }
      });

      apiResponse.body.on('end', () => {
        deltaChunk = '';
        console.log(`[Node Proxy] Vertex stream finished and all data processed for ${apiClient.name}`);
        res.end();
      });

      apiResponse.body.on('error', (streamError) => {
        console.error('[Node Proxy] Error from Vertex stream:', streamError);
        if (!res.writableEnded) {
          res.end(JSON.stringify({ proxyError: 'Stream error from Vertex AI', details: streamError.message }));
        }
      });

      res.on('error', (resError) => {
        console.error('[Node Proxy] Error writing to client response:', resError);
        // The source stream might need to be destroyed if an error occurs here.
        if (apiResponse.body && typeof apiResponse.body.destroy === 'function') {
             apiResponse.body.destroy(resError);
        }
      });
    } else {
      // Non-streaming response handling
      console.log(`[Node Proxy] Sending JSON response for ${apiClient.name}`);
      const data = await apiResponse.json();
      res.status(apiResponse.status).json(data);
    }
  } catch (error) {
    console.error(`[Node Proxy] Error proxying request for ${apiClient.name}`);
    console.error(error)
    res.status(500).json({ error: error });
  }
});

const server = app.listen(PORT, API_BACKEND_HOST, () => {
  console.log(`Vertex AI Backend listening at http://localhost:${PORT}`);
});





// =============================================================================
// NEXUS STUDIO — CORS + GENERATE/JOBS ENDPOINTS
// Ditambahkan untuk mendukung frontend Nexus Studio
// =============================================================================

import cors from 'cors';
import crypto from 'crypto';

// ---- CORS ----
// Izinkan request dari frontend Vite (localhost:5173) dan domain lain
app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow all origins (bisa dibatasi kalau perlu)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.options('/{*path}', cors()); // Express v5 wildcard syntax

// ---- In-memory job store ----
// Untuk development/demo. Ganti dengan database di production.
const jobStore = new Map();

// ---- Auth middleware untuk studio endpoints ----
function checkStudioAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || token !== PROXY_HEADER) {
    return res.status(403).json({ error: 'Forbidden: Token tidak valid. Isi API token yang benar di sidebar.' });
  }
  next();
}

// ---- Helper: call Vertex AI Veo (video generation) ----
async function callVeoGenerate(payload) {
  const accessToken = await getAccessToken(null);
  if (!accessToken) throw new Error('Gagal mendapatkan Google Cloud access token. Pastikan sudah jalankan: gcloud auth application-default login');

  const model = payload.videoModelMode === 'quality' ? 'veo-2.0-generate-001' : 'veo-2.0-generate-001';
  const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/us-central1/publishers/google/models/${model}:generateVideo`;

  const veoPayload = {
    prompt: payload.prompt,
    generationConfig: {
      aspectRatio: payload.aspectRatio || '16:9',
      durationSeconds: parseInt(payload.durationSeconds) || 8,
    },
  };

  if (payload.heroImageGcsPath) {
    veoPayload.image = { gcsUri: payload.heroImageGcsPath, mimeType: 'image/jpeg' };
  }
  if (payload.startFrameGcsPath) {
    veoPayload.startFrame = { gcsUri: payload.startFrameGcsPath, mimeType: 'image/jpeg' };
  }
  if (payload.endFrameGcsPath) {
    veoPayload.endFrame = { gcsUri: payload.endFrameGcsPath, mimeType: 'image/jpeg' };
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Goog-User-Project': GOOGLE_CLOUD_PROJECT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instances: [veoPayload], parameters: {} }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Veo API error ${res.status}`);
  return data;
}

// ---- Helper: call Vertex AI Imagen (image generation) ----
async function callNanoGenerate(payload) {
  const accessToken = await getAccessToken(null);
  if (!accessToken) throw new Error('Gagal mendapatkan Google Cloud access token.');

  const model = 'imagen-3.0-generate-002';
  const apiUrl = `https://${GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/${GOOGLE_CLOUD_LOCATION}/publishers/google/models/${model}:predict`;

  const aspectRatioMap = {
    '1:1': '1:1', '9:16': '9:16', '16:9': '16:9', '3:4': '3:4', '4:3': '4:3',
  };
  const mappedAspectRatio = aspectRatioMap[payload.aspectRatio] || '1:1';

  const instance = {
    prompt: payload.prompt,
  };
  if (payload.heroImageGcsPath) {
    instance.referenceImages = [{ referenceType: 'REFERENCE_TYPE_SUBJECT', referenceImage: { gcsUri: payload.heroImageGcsPath } }];
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Goog-User-Project': GOOGLE_CLOUD_PROJECT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [instance],
      parameters: {
        sampleCount: 1,
        aspectRatio: mappedAspectRatio,
        outputOptions: { mimeType: 'image/jpeg' },
        addWatermark: false,
        safetySetting: 'block_some',
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Imagen API error ${res.status}`);
  return data;
}

// ---- Helper: poll Veo operation status ----
async function pollVeoOperation(operationName) {
  const accessToken = await getAccessToken(null);
  const res = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/${operationName}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Goog-User-Project': GOOGLE_CLOUD_PROJECT,
    },
  });
  const data = await res.json();
  return data;
}

// =============================================================================
// POST /generate/veo  — Generate video
// =============================================================================
app.post('/generate/veo', checkStudioAuth, async (req, res) => {
  try {
    const payload = req.body;
    const jobId = payload.jobId || `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    console.log(`[Veo] Starting job ${jobId} — prompt: "${String(payload.prompt).slice(0, 80)}..."`);

    // Simpan job sebagai "queued" dulu, lalu proses async
    const job = {
      jobId,
      status: 'queued',
      toolType: 'VIDEO_VEO',
      prompt: payload.prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provider: 'veo',
      result: null,
      error: null,
      _operationName: null,
    };
    jobStore.set(jobId, job);

    // Respond langsung dengan status queued
    res.json({ jobId, status: 'queued', createdAt: job.createdAt });

    // Proses di background
    (async () => {
      try {
        job.status = 'running';
        job.updatedAt = new Date().toISOString();

        const veoResult = await callVeoGenerate(payload);
        const operationName = veoResult?.name;

        if (!operationName) {
          throw new Error('Veo tidak mengembalikan operation name. Response: ' + JSON.stringify(veoResult).slice(0, 300));
        }

        job._operationName = operationName;
        console.log(`[Veo] Job ${jobId} running — operation: ${operationName}`);

        // Poll sampai selesai (max 10 menit)
        const maxAttempts = 60;
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const opData = await pollVeoOperation(operationName);
            if (opData.done) {
              clearInterval(pollInterval);
              if (opData.error) {
                job.status = 'failed';
                job.error = opData.error?.message || 'Veo operation failed';
              } else {
                const videoUri = opData.response?.videos?.[0]?.gcsUri || opData.response?.generatedSamples?.[0]?.video?.gcsUri;
                job.status = 'succeeded';
                job.result = { url: videoUri };
                job.resultUrl = videoUri;
              }
              job.updatedAt = new Date().toISOString();
              console.log(`[Veo] Job ${jobId} done — status: ${job.status}`);
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              job.status = 'failed';
              job.error = 'Timeout: Veo generation exceeded 10 minutes';
              job.updatedAt = new Date().toISOString();
            }
          } catch (pollErr) {
            console.error(`[Veo] Poll error for ${jobId}:`, pollErr.message);
          }
        }, 10000); // poll setiap 10 detik

      } catch (err) {
        job.status = 'failed';
        job.error = err.message;
        job.updatedAt = new Date().toISOString();
        console.error(`[Veo] Job ${jobId} failed:`, err.message);
      }
    })();

  } catch (err) {
    console.error('[Veo] Handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /generate/nano  — Generate image
// =============================================================================
app.post('/generate/nano', checkStudioAuth, async (req, res) => {
  try {
    const payload = req.body;
    const jobId = payload.jobId || `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    console.log(`[Nano] Starting job ${jobId} — prompt: "${String(payload.prompt).slice(0, 80)}..."`);

    const job = {
      jobId,
      status: 'running',
      toolType: 'IMAGE_NANO',
      prompt: payload.prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provider: 'imagen',
      result: null,
      error: null,
    };
    jobStore.set(jobId, job);

    // Respond queued dulu
    res.json({ jobId, status: 'queued', createdAt: job.createdAt });

    // Proses di background
    (async () => {
      try {
        const imgResult = await callNanoGenerate(payload);

        // Imagen langsung return base64 image
        const base64Image = imgResult?.predictions?.[0]?.bytesBase64Encoded;
        const mimeType = imgResult?.predictions?.[0]?.mimeType || 'image/jpeg';

        if (!base64Image) {
          throw new Error('Imagen tidak mengembalikan gambar. Response: ' + JSON.stringify(imgResult).slice(0, 300));
        }

        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        job.status = 'succeeded';
        job.result = { url: dataUrl };
        job.resultUrl = dataUrl;
        job.updatedAt = new Date().toISOString();
        console.log(`[Nano] Job ${jobId} succeeded`);

      } catch (err) {
        job.status = 'failed';
        job.error = err.message;
        job.updatedAt = new Date().toISOString();
        console.error(`[Nano] Job ${jobId} failed:`, err.message);
      }
    })();

  } catch (err) {
    console.error('[Nano] Handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /jobs/:id  — Cek status job
// =============================================================================
app.get('/jobs/:jobId', checkStudioAuth, (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: `Job ${req.params.jobId} tidak ditemukan` });
  }
  res.json(job);
});

// =============================================================================
// POST /uploads/sign  — Signed URL untuk upload GCS (placeholder)
// =============================================================================
app.post('/uploads/sign', checkStudioAuth, (req, res) => {
  // TODO: Implement GCS signed URL jika butuh upload gambar referensi
  // Untuk sekarang return dummy response agar tidak error
  const { jobId, kind, filename } = req.body;
  console.log(`[Upload] Sign request — job: ${jobId}, kind: ${kind}, file: ${filename}`);
  res.status(501).json({
    error: 'Signed upload belum dikonfigurasi. Untuk sekarang, gunakan Text to Video/Image tanpa upload file referensi.',
  });
});

// =============================================================================
// GET /health  — Health check
// =============================================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: GOOGLE_CLOUD_PROJECT, location: GOOGLE_CLOUD_LOCATION });
});

