import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { config } from '../config';

export interface AiModelMetadata {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'groq' | 'deepseek';
  description: string;
  badge: string;
  isConfigured: boolean;
  envKeyHint: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant' | 'model' | 'ai';
  text?: string;
  content?: string;
}

export interface GenerateResult {
  reply: string;
  source: string;
  model: string;
  provider: string;
  switched?: boolean;
  notice?: string;
}

// Dynamically read fresh environment variables from .env files so updates become live instantly
export function getLiveAiCredentials() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  let parsed: Record<string, string> = {};

  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const parsedFile = dotenv.parse(content);
        parsed = { ...parsed, ...parsedFile };
      } catch {}
    }
  }

  // Merge process.env with priority to newly parsed .env values
  return {
    geminiKey: parsed.AI_API_KEY || parsed.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || config.ai.apiKey || '',
    geminiBackupKey: parsed.AI_API_KEY_BACKUP || parsed.GEMINI_API_KEY_2 || process.env.AI_API_KEY_BACKUP || '',
    openaiKey: parsed.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
    groqKey: parsed.GROQ_API_KEY || process.env.GROQ_API_KEY || '',
    deepseekKey: parsed.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '',
    defaultModel: parsed.AI_MODEL || process.env.AI_MODEL || config.ai.model || 'gemini-3.5-flash-lite',
  };
}

// Catalog of supported AI models across providers
export function getAvailableModelsList(): AiModelMetadata[] {
  const creds = getLiveAiCredentials();

  return [
    {
      id: 'gemini-3.5-flash-lite',
      name: 'Gemini 3.5 Flash Lite',
      provider: 'gemini',
      description: 'Ultra-fast and efficient, ideal for quick academic Q&A',
      badge: 'Recommended',
      isConfigured: Boolean(creds.geminiKey),
      envKeyHint: 'AI_API_KEY or GEMINI_API_KEY',
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      provider: 'gemini',
      description: 'Rapid response time with strong reasoning',
      badge: 'Fast',
      isConfigured: Boolean(creds.geminiKey),
      envKeyHint: 'AI_API_KEY or GEMINI_API_KEY',
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'gemini',
      description: 'High-quality reasoning across STEM & coding',
      badge: 'Stable',
      isConfigured: Boolean(creds.geminiKey),
      envKeyHint: 'AI_API_KEY or GEMINI_API_KEY',
    },
    {
      id: 'gemini-flash-latest',
      name: 'Gemini Flash Latest',
      provider: 'gemini',
      description: 'Always points to the latest Google Gemini Flash model',
      badge: 'Auto-Updated',
      isConfigured: Boolean(creds.geminiKey),
      envKeyHint: 'AI_API_KEY or GEMINI_API_KEY',
    },
    {
      id: 'gpt-4o-mini',
      name: 'OpenAI GPT-4o Mini',
      provider: 'openai',
      description: 'Fast, cost-effective OpenAI model with broad knowledge',
      badge: 'OpenAI',
      isConfigured: Boolean(creds.openaiKey),
      envKeyHint: 'OPENAI_API_KEY',
    },
    {
      id: 'gpt-4o',
      name: 'OpenAI GPT-4o',
      provider: 'openai',
      description: 'OpenAI flagship model with highest multimodal intelligence',
      badge: 'OpenAI Pro',
      isConfigured: Boolean(creds.openaiKey),
      envKeyHint: 'OPENAI_API_KEY',
    },
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Groq LLaMA 3.3 70B',
      provider: 'groq',
      description: 'Blazing fast inference on Groq LPU with Meta LLaMA 3.3',
      badge: 'Groq LPU',
      isConfigured: Boolean(creds.groqKey),
      envKeyHint: 'GROQ_API_KEY',
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Groq LLaMA 3.1 8B',
      provider: 'groq',
      description: 'Ultra-low latency responses for instant study help',
      badge: 'Ultra Fast',
      isConfigured: Boolean(creds.groqKey),
      envKeyHint: 'GROQ_API_KEY',
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat (V3)',
      provider: 'deepseek',
      description: 'State of the art coding and math problem solving',
      badge: 'DeepSeek',
      isConfigured: Boolean(creds.deepseekKey),
      envKeyHint: 'DEEPSEEK_API_KEY',
    },
  ];
}

// Call Google Gemini API
async function callGemini(
  model: string,
  apiKey: string,
  systemInstruction: string,
  history: ChatTurn[],
  prompt: string
): Promise<string> {
  const formattedContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

  for (const item of history) {
    const text = item.text || item.content;
    if (!text || !text.trim()) continue;
    const role = (item.role === 'ai' || item.role === 'assistant' || item.role === 'model') ? 'model' : 'user';
    formattedContents.push({
      role,
      parts: [{ text: text.trim() }],
    });
  }

  const lastItem = formattedContents[formattedContents.length - 1];
  if (!lastItem || lastItem.role !== 'user' || lastItem.parts[0].text !== prompt.trim()) {
    formattedContents.push({
      role: 'user',
      parts: [{ text: prompt.trim() }],
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: formattedContents,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error [${response.status}]: ${errText.slice(0, 200)}`);
  }

  const json: any = await response.json();
  const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) {
    throw new Error('Gemini API returned empty candidate response');
  }
  return reply;
}

// Call OpenAI-compatible endpoints (OpenAI, Groq, DeepSeek)
async function callOpenAiCompatible(
  apiUrl: string,
  apiKey: string,
  model: string,
  systemInstruction: string,
  history: ChatTurn[],
  prompt: string
): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemInstruction },
  ];

  for (const item of history) {
    const text = item.text || item.content;
    if (!text || !text.trim()) continue;
    const role = (item.role === 'ai' || item.role === 'assistant' || item.role === 'model') ? 'assistant' : 'user';
    messages.push({ role, content: text.trim() });
  }

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== prompt.trim()) {
    messages.push({ role: 'user', content: prompt.trim() });
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Provider API error [${response.status}]: ${errText.slice(0, 200)}`);
  }

  const json: any = await response.json();
  const reply = json?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('Provider returned empty choices');
  }
  return reply;
}

// Main execution function with automatic model fallback when rate-limited or unavailable
export async function executeAiQuery(params: {
  prompt: string;
  systemInstruction: string;
  history?: ChatTurn[];
  requestedModel?: string;
  requestedProvider?: string;
}): Promise<GenerateResult> {
  const { prompt, systemInstruction, history = [], requestedModel } = params;
  const creds = getLiveAiCredentials();

  // Determine primary model and provider
  const primaryModel = requestedModel || creds.defaultModel;

  // Build candidate execution sequence: requested model first, then configured alternatives
  const executionPlan: Array<{
    provider: 'gemini' | 'openai' | 'groq' | 'deepseek';
    model: string;
    apiKey: string;
  }> = [];

  const addIfConfigured = (provider: 'gemini' | 'openai' | 'groq' | 'deepseek', model: string, key: string) => {
    if (key && key.trim() && !executionPlan.some(e => e.provider === provider && e.model === model && e.apiKey === key)) {
      executionPlan.push({ provider, model, apiKey: key.trim() });
    }
  };

  // Determine provider for requested model
  const catalog = getAvailableModelsList();
  const matched = catalog.find(m => m.id === primaryModel);

  if (matched) {
    if (matched.provider === 'gemini' && creds.geminiKey) {
      addIfConfigured('gemini', matched.id, creds.geminiKey);
      if (creds.geminiBackupKey) addIfConfigured('gemini', matched.id, creds.geminiBackupKey);
    } else if (matched.provider === 'openai' && creds.openaiKey) {
      addIfConfigured('openai', matched.id, creds.openaiKey);
    } else if (matched.provider === 'groq' && creds.groqKey) {
      addIfConfigured('groq', matched.id, creds.groqKey);
    } else if (matched.provider === 'deepseek' && creds.deepseekKey) {
      addIfConfigured('deepseek', matched.id, creds.deepseekKey);
    }
  }

  // Add available fallbacks in priority order
  if (creds.geminiKey) {
    addIfConfigured('gemini', 'gemini-3.5-flash-lite', creds.geminiKey);
    addIfConfigured('gemini', 'gemini-3.1-flash-lite', creds.geminiKey);
    addIfConfigured('gemini', 'gemini-2.5-flash', creds.geminiKey);
  }
  if (creds.geminiBackupKey) {
    addIfConfigured('gemini', 'gemini-3.5-flash-lite', creds.geminiBackupKey);
    addIfConfigured('gemini', 'gemini-3.1-flash-lite', creds.geminiBackupKey);
  }
  if (creds.groqKey) {
    addIfConfigured('groq', 'llama-3.3-70b-versatile', creds.groqKey);
    addIfConfigured('groq', 'llama-3.1-8b-instant', creds.groqKey);
  }
  if (creds.openaiKey) {
    addIfConfigured('openai', 'gpt-4o-mini', creds.openaiKey);
  }
  if (creds.deepseekKey) {
    addIfConfigured('deepseek', 'deepseek-chat', creds.deepseekKey);
  }

  if (executionPlan.length === 0) {
    throw new Error('NO_API_KEY_CONFIGURED');
  }

  let lastError: any = null;

  for (let i = 0; i < executionPlan.length; i++) {
    const attempt = executionPlan[i];
    const isSwitched = i > 0;

    try {
      let reply = '';
      if (attempt.provider === 'gemini') {
        reply = await callGemini(attempt.model, attempt.apiKey, systemInstruction, history, prompt);
      } else if (attempt.provider === 'openai') {
        reply = await callOpenAiCompatible(
          'https://api.openai.com/v1/chat/completions',
          attempt.apiKey,
          attempt.model,
          systemInstruction,
          history,
          prompt
        );
      } else if (attempt.provider === 'groq') {
        reply = await callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          attempt.apiKey,
          attempt.model,
          systemInstruction,
          history,
          prompt
        );
      } else if (attempt.provider === 'deepseek') {
        reply = await callOpenAiCompatible(
          'https://api.deepseek.com/chat/completions',
          attempt.apiKey,
          attempt.model,
          systemInstruction,
          history,
          prompt
        );
      }

      if (reply) {
        return {
          reply,
          source: `${attempt.provider}-api`,
          model: attempt.model,
          provider: attempt.provider,
          switched: isSwitched,
          notice: isSwitched ? `Automatically swapped to ${attempt.model} because the previous model reached its rate limit.` : undefined,
        };
      }
    } catch (err: any) {
      console.warn(`[AI Engine] Attempt ${i + 1}/${executionPlan.length} (${attempt.provider}:${attempt.model}) failed:`, err.message || err);
      lastError = err;
      // Continue to next candidate model
    }
  }

  throw lastError || new Error('All AI service providers and models failed.');
}
