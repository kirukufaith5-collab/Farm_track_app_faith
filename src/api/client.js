/**
 * In local Vite dev, leave VITE_API_URL unset (or empty) so requests go to
 * the same origin and the Vite proxy forwards /api → backend.
 * In production (Vercel), set VITE_API_URL to the Render backend URL.
 */
const raw = import.meta.env.VITE_API_URL;
const API_BASE = (raw === undefined || raw === '' ? '' : String(raw)).replace(/\/$/, '');
const API_V1 = `${API_BASE}/api/v1`;

/**
 * Fetch wrapper for the FarmTrack API.
 * Always sends cookies (JWT HTTP-only) and JSON body when present.
 */
export async function api(path, options = {}) {
  const { body, headers, ...rest } = options;
  const res = await fetch(`${API_V1}${path}`, {
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!res.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
          : data?.message || res.statusText || 'Request failed';
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export { API_BASE, API_V1 };
