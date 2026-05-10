import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from parent project
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadEnv();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const IMAGE_API_KEY = process.env.IMAGE_GEN_API_KEY;
const IMAGE_BASE_URL = process.env.IMAGE_GEN_BASE_URL || 'https://api.moocoo.ai/v1';
const IMAGE_MODEL = process.env.IMAGE_GEN_MODEL || 'gpt-image-2';

const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_BASE_URL = process.env.VISION_BASE_URL || 'https://api.bltcy.ai/v1';
const VISION_MODEL = process.env.VISION_MODEL || 'gpt-5.5-2026-04-23';

app.post('/api/generate-image', async (req, res) => {
  if (!IMAGE_API_KEY) {
    return res.status(500).json({ error: 'IMAGE_GEN_API_KEY not configured' });
  }

  const { prompt, aspectRatio = '16:9', imageSize } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size: imageSize || ({ '16:9': '1792x1024', '9:16': '1024x1792' }[aspectRatio] || '1024x1024'),
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Image API error:', response.status, errText);
      return res.status(response.status).json({ error: `Image API: ${response.status}` });
    }

    const data = await response.json();
    const imageB64 = data.data?.[0]?.b64_json;
    if (!imageB64) {
      return res.status(500).json({ error: 'No image data in response' });
    }

    const dataUrl = imageB64.startsWith('data:') ? imageB64 : `data:image/png;base64,${imageB64}`;
    res.json({ dataUrl });
  } catch (err) {
    console.error('Image generation failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analyze-photo', async (req, res) => {
  if (!VISION_API_KEY) {
    return res.status(500).json({ error: 'VISION_API_KEY not configured' });
  }

  const { imageDataUrl } = req.body;
  if (!imageDataUrl) {
    return res.status(400).json({ error: 'imageDataUrl is required' });
  }

  try {
    const response = await fetch(`${VISION_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VISION_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `分析这张照片中人物的外貌特征，用于生成虚拟角色。请以纯JSON格式返回（不要markdown代码块）：
{"keywords":["关键词1","关键词2",...],"description":"一段完整的角色外貌描述"}

要求：
- keywords：提取发型发色、面部特征、体型、服装、配饰、气质等关键词，每个2-6字，8-15个
- description：50-100字的完整描述，适合用于生成动漫/像素/赛博等风格的虚拟角色
- 如果照片中没有人物，根据图片内容想象一个与之相关的角色`
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl }
            }
          ]
        }],
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Vision API error:', response.status, errText);
      return res.status(response.status).json({ error: `Vision API: ${response.status}` });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = { keywords: [], description: text };
    }

    res.json({
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      description: typeof parsed.description === 'string' ? parsed.description : '',
    });
  } catch (err) {
    console.error('Photo analysis failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  res.json({ text: '我在听。（Web 演示模式）', source: 'mock' });
});

app.post('/api/speak', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/runtime-status', (_req, res) => {
  res.json({
    native: false,
    hermes: null,
    tts: { configured: false, provider: 'browser' },
    airjelly: { source: 'mock' },
  });
});

const PORT = process.env.API_PORT || 7291;
app.listen(PORT, () => {
  console.log(`[ocworld-api] running on http://localhost:${PORT}`);
  console.log(`[ocworld-api] IMAGE_GEN: ${IMAGE_API_KEY ? 'configured ✓' : 'NOT configured ✗'}`);
  console.log(`[ocworld-api] VISION:    ${VISION_API_KEY ? 'configured ✓' : 'NOT configured ✗'}`);
});
