// STRIDE LLM Service
// Provider fallback chain: Ollama (local) → Groq → Together AI → OpenRouter
// All use OpenAI-compatible chat completions API

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

interface Provider {
  name: string;
  url: string;
  model: string;
  apiKey: string | undefined;
}

function getProviders(): Provider[] {
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL;
  const ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || "qwen2.5:14b";

  return [
    // Local Ollama — fastest, no rate limits, no cost
    ...(ollamaUrl ? [{
      name: "ollama",
      url: `${ollamaUrl}/v1/chat/completions`,
      model: ollamaModel,
      apiKey: "ollama",  // Ollama doesn't validate keys but header is expected
    }] : []),
    // Cloud fallbacks
    {
      name: "groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      model: "llama-3.3-70b-versatile",
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
    },
    {
      name: "together",
      url: "https://api.together.xyz/v1/chat/completions",
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      apiKey: import.meta.env.VITE_TOGETHER_API_KEY,
    },
    {
      name: "openrouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    },
  ];
}

async function callProvider(
  provider: Provider,
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 512, timeoutMs = 30000 } = options;

  // Ollama cold starts can take 30-60s for model loading
  const effectiveTimeout = provider.name === "ollama"
    ? Math.max(timeoutMs, 60000)
    : timeoutMs;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`${provider.name} ${res.status}: ${body}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${provider.name}: empty response`);
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Send a chat completion request with automatic provider fallback.
 * Tries Groq → Together → OpenRouter. Skips providers without API keys.
 */
export async function chatCompletion(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const providers = getProviders().filter((p) => p.apiKey);

  if (providers.length === 0) {
    console.warn("[LLM] No providers configured — using template fallback");
    throw new Error("NO_PROVIDERS");
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return await callProvider(provider, messages, options);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[LLM] ${provider.name} failed: ${msg}`);
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join("\n")}`);
}

/**
 * Chat completion that returns JSON. Retries once with a stricter prompt on parse failure.
 */
export async function chatCompletionJSON<T = unknown>(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<T> {
  const raw = await chatCompletion(messages, options);

  // Try to extract JSON from the response (may be wrapped in markdown code blocks)
  const jsonStr = extractJSON(raw);

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Retry with a stricter instruction
    const retryMessages: LLMMessage[] = [
      ...messages,
      { role: "assistant", content: raw },
      {
        role: "user",
        content:
          "Your previous response was not valid JSON. Output ONLY the JSON object, no markdown, no explanation, no code blocks.",
      },
    ];

    const retryRaw = await chatCompletion(retryMessages, options);
    const retryJson = extractJSON(retryRaw);
    return JSON.parse(retryJson) as T;
  }
}

/** Extract JSON from a string that may be wrapped in ```json ... ``` */
function extractJSON(str: string): string {
  // Try to find JSON in code blocks first
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find a JSON object or array
  const jsonMatch = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1];

  return str.trim();
}
