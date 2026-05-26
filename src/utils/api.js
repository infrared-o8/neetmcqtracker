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
    // Only add default port if it's missing AND it's not https/ngrok
    const isNgrok = url.hostname.includes("ngrok");
    const isHttps = url.protocol === "https:";

    if (!url.port && !isHttps && !isNgrok) {
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

function fetchWithTimeout(url, options = {}, ms = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const { signal: outerSignal, ...rest } = options;

  if (outerSignal) {
    outerSignal.addEventListener("abort", () => controller.abort());
  }

  return fetch(url, {
    ...rest,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

export function describeFetchError(err, targetUrl) {
  if (!err) return "Unknown error";
  if (err.name === "AbortError") {
    return `Timed out reaching ${targetUrl}. The server might be waking up (Render Free Tier takes ~1m). Please wait or refresh.`;
  }
  const msg = err.message || String(err);
  if (/failed to fetch|networkerror|load failed|tcp|connection/i.test(msg)) {
    return [
      `Cannot connect to ${targetUrl}.`,
      "If the server is on Render free tier, it may be waking up.",
      "Check your internet connection and verify the Leaderboard Server URL in Settings.",
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
        "ngrok-skip-browser-warning": "true",
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
    const res = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
      timeoutMs,
    );
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
