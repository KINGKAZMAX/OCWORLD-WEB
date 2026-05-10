/**
 * OCWORLD Web API Service
 * Replaces Electron IPC with HTTP API calls for server deployment.
 * All endpoints are configurable via environment variables.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface ChatPayload {
  system: string;
  messages: { role: string; content: string }[];
}

export interface ChatResponse {
  text: string;
  source?: string;
}

export interface ImageGenPayload {
  prompt: string;
  aspectRatio?: string;
  imageSize?: string;
}

export interface ImageGenResponse {
  dataUrl: string;
}

export interface AnalyzePhotoPayload {
  imageDataUrl: string;
}

export interface AnalyzePhotoResponse {
  keywords: string[];
  description: string;
}

export interface RuntimeStatus {
  native: boolean;
  hermes: { state?: string } | null;
  tts: { configured?: boolean; provider?: string } | null;
  airjelly: { source?: string } | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /** Send a chat message to the LLM */
  async chat(payload: ChatPayload): Promise<ChatResponse> {
    return post<ChatResponse>('/chat', payload);
  },

  /** Generate an OC portrait image */
  async generateImage(payload: ImageGenPayload): Promise<ImageGenResponse> {
    return post<ImageGenResponse>('/generate-image', payload);
  },

  /** Analyze a photo to extract appearance keywords */
  async analyzePhoto(payload: AnalyzePhotoPayload): Promise<AnalyzePhotoResponse> {
    return post<AnalyzePhotoResponse>('/analyze-photo', payload);
  },

  /** Get runtime status (Hermes, TTS, AirJelly) */
  async getRuntimeStatus(): Promise<RuntimeStatus> {
    return get<RuntimeStatus>('/runtime-status');
  },

  /** Text-to-speech */
  async speak(text: string): Promise<void> {
    await post('/speak', { text });
  },

  /** Health check */
  async health(): Promise<{ status: string }> {
    return get<{ status: string }>('/health');
  },
};

/** Fallback chat for demo / offline mode */
export function fallbackReply(text: string, lang: 'zh' | 'en'): string {
  const t = text.toLowerCase();
  if (lang === 'en') {
    if (t.length < 4) return 'mm, listening.';
    if (t.includes('tired') || t.includes('sleep')) return "Then take a small break. I'll stay here.";
    if (t.includes('plan')) return 'Pick the smallest one — not the most important, the easiest to start.';
    return "Noted, quietly. Want me to help sort this out?";
  }
  if (t.length < 4) return '嗯，我在听。';
  if (t.includes('累') || t.includes('困')) return '那就先停一会儿吧。我陪你一会儿。';
  if (t.includes('计划') || t.includes('plan')) return '先选一件最小的事——不是最重要的，是最容易开始的那个。';
  return '我把这件事悄悄记下了。要不要我先帮你整理一下？';
}
