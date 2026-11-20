export class UpstreamError extends Error {
  constructor(
    message: string,
    public status = 0,
    public body: unknown = null,
  ) {
    super(message);
  }
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw new UpstreamError("timeout", 0);
    throw new UpstreamError((error as Error).message || "network error", 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 2000) };
  }
}

export function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
