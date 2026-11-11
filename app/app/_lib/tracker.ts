// Client for the tracker backend. Every call goes to this site's own
// /api/tracker proxy, which attaches the user's tracker session on the server.

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly detail: string) {
    super(detail);
  }
}

function detailOf(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const d = (body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    // FastAPI validation errors: [{loc, msg}, ...]
    if (Array.isArray(d)) {
      return d.map((e) => (e && typeof e === "object" && "msg" in e ? String((e as { msg: unknown }).msg) : "")).filter(Boolean).join(". ") || fallback;
    }
  }
  return fallback;
}

/**
 * Call the tracker. `path` is the backend path without the /api/ prefix,
 * e.g. api<Aircraft[]>("aircraft").
 */
export async function api<T>(path: string, init: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? "GET";
  let res: Response;
  try {
    res = await fetch(`/api/tracker/${path}`, {
      method,
      headers: {
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" ? { "x-fp-app": "1" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Can't reach FinalPing. Check your connection.");
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const fallback =
      res.status === 502 ? "The tracker isn't responding right now." :
      res.status === 401 ? "Your session has ended. Sign in again." :
      "Something went wrong.";
    throw new ApiError(res.status, detailOf(body, fallback));
  }
  return body as T;
}

/** A message fit to show a person, from anything a call might throw. */
export function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.detail;
  return "Something went wrong.";
}
