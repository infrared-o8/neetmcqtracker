const DEFAULT_PORT = 3847;

/** Normalize user input → origin e.g. http://192.168.1.5:3847 */
export function normalizeServerUrl(input) {
  let s = input?.trim();
  if (!s) return "";

  s = s.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) {
    s = `http://${s}`;
  }

  try {
    const url = new URL(s);
    if (!url.port) {
      url.port = String(DEFAULT_PORT);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function getApiBase(serverUrl) {
  return normalizeServerUrl(serverUrl) || "";
}

export function apiUrl(serverUrl, path) {
  const base = getApiBase(serverUrl);
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function fetchWithTimeout(url, options = {}, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const { signal: outerSignal, ...rest } = options;

  if (outerSignal) {
    outerSignal.addEventListener("abort", () => controller.abort());
  }

  return fetch(url, {
    ...rest,
    mode: "cors",
    credentials: "omit",
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

export function describeFetchError(err, targetUrl) {
  if (!err) return "Unknown error";
  if (err.name === "AbortError") {
    return `Timed out reaching ${targetUrl}. Check firewall and that both PCs are on the same Wi‑Fi.`;
  }
  const msg = err.message || String(err);
  if (/failed to fetch|networkerror|load failed|tcp|connection/i.test(msg)) {
    return [
      `Cannot connect to ${targetUrl}.`,
      "Friend's laptop: run npm run server and allow port 3847 in Windows Firewall.",
      "Use full URL: http://THEIR_IP:3847 (same Wi‑Fi, not mobile hotspot guest mode).",
    ].join(" ");
  }
  return msg;
}

export async function apiFetch(serverUrl, path, options = {}) {
  const url = apiUrl(serverUrl, path);
  const base = getApiBase(serverUrl);

  if (path.startsWith("/api") && base && !base.startsWith("http")) {
    throw new Error("Invalid server URL — use http://IP:3847");
  }

  try {
    const res = await fetchWithTimeout(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return res;
  } catch (err) {
    const enriched = new Error(describeFetchError(err, url));
    enriched.cause = err;
    enriched.url = url;
    throw enriched;
  }
}

export async function checkServerHealth(serverUrl, timeoutMs = 8000) {
  const normalized = getApiBase(serverUrl);
  const url = apiUrl(serverUrl, "/api/health");

  if (serverUrl?.trim() && !normalized) {
    return {
      ok: false,
      error: "Invalid URL. Example: http://192.168.1.42:3847",
      url,
    };
  }

  try {
    const res = await fetchWithTimeout(url, { method: "GET" }, timeoutMs);
    if (!res.ok) {
      return { ok: false, error: `Server returned ${res.status}`, url };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, url, time: data.time };
  } catch (err) {
    return {
      ok: false,
      error: err.message || describeFetchError(err, url),
      url,
    };
  }
}
