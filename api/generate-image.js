import {
  imageKey,
  IMAGE_BASE_URL,
  IMAGE_MODEL,
  preflight,
  readBody,
  sendJson,
  fetchWithTimeout,
} from './_lib/stepfun.js';

const SIZE_MAP = {
  '16:9': '1280x800',
  '9:16': '800x1280',
};

export default async function handler(req, res) {
  if (preflight(req, res, 'POST')) return;

  const key = imageKey();
  if (!key) {
    return sendJson(res, 503, { error: 'Image generation not configured' });
  }

  const { prompt, aspectRatio = '1:1' } = readBody(req);
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return sendJson(res, 400, { error: 'prompt is required' });
  }

  const size = SIZE_MAP[aspectRatio] || '1024x1024';
  const requestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size,
      response_format: 'b64_json',
    }),
  };

  // One retry on 5xx / network errors.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchWithTimeout(`${IMAGE_BASE_URL}/images/generations`, requestInit, 50000);

      if (!response.ok) {
        console.error('Image API error:', response.status);
        response.body?.cancel?.().catch(() => {});
        if (response.status >= 500 && attempt === 0) continue;
        return sendJson(res, 502, { error: 'Image generation failed' });
      }

      const data = await response.json();
      const imageB64 = data.data?.[0]?.b64_json;
      if (!imageB64) {
        return sendJson(res, 502, { error: 'Image generation failed' });
      }

      const dataUrl = imageB64.startsWith('data:') ? imageB64 : `data:image/png;base64,${imageB64}`;
      return sendJson(res, 200, { dataUrl });
    } catch (err) {
      console.error('Image generation failed:', err?.message);
      if (attempt === 0) continue;
      return sendJson(res, 502, { error: 'Image generation failed' });
    }
  }
}
