/** Optional OpenAI-compatible chat completion. Returns null when no key is configured or on any failure. */
import { env } from "./env";

export async function chatJson(system: string, user: string, timeoutMs = 8000): Promise<unknown | null> {
  const { apiKey, baseUrl, model } = env.llm;
  if (!apiKey) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content ?? "null");
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export const llmEnabled = () => !!env.llm.apiKey;
