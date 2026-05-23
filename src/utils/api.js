/** Empty serverUrl = same-origin /api (Vite proxy → localhost:3847 in dev). */
export function getApiBase(serverUrl) {
  const trimmed = serverUrl?.trim().replace(/\/$/, "");
  return trimmed || "";
}

export function apiUrl(serverUrl, path) {
  const base = getApiBase(serverUrl);
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export async function apiFetch(serverUrl, path, options = {}) {
  const url = apiUrl(serverUrl, path);
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}
