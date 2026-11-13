// app/api/tracker/[...path]/route.ts
//
// The web app's only door to the tracker backend. The browser calls
// /api/tracker/<path>; this handler checks the website session, attaches the
// user's tracker JWT (lib/trackerSession) and forwards to <backend>/api/<path>.
// The backend's status and JSON body are passed back unchanged.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  TRACKER_URL, TRACKER_COOKIE, TRACKER_COOKIE_MAX_AGE, TRACKER_ORIGIN_HEADERS,
  TrackerAuthError, mintTrackerToken, packTrackerCookie, unpackTrackerCookie,
} from "@/lib/trackerSession";

export const dynamic = "force-dynamic";

type Method = "GET" | "POST" | "PUT" | "DELETE";

// Exactly what the web app uses, and nothing else. Anything not listed is a
// 404 here even though the backend has it: /api/internal, /api/admin,
// /api/licenses, /api/teams and the ground station's own device endpoints are
// never reachable through this proxy.
const ALLOWED: { prefix: string; methods: Method[]; exact?: boolean }[] = [
  { prefix: "user/me", methods: ["GET"], exact: true },
  { prefix: "aircraft", methods: ["GET", "POST", "PUT", "DELETE"] },
  { prefix: "airport/config", methods: ["GET", "POST"], exact: true },
  { prefix: "locations", methods: ["GET", "POST", "PUT", "DELETE"] },
  { prefix: "settings/alerts", methods: ["GET", "POST"], exact: true },
  { prefix: "settings/routing", methods: ["GET", "PUT"], exact: true },
  { prefix: "integrations", methods: ["GET", "POST", "PUT", "DELETE"] },
  { prefix: "notifications", methods: ["GET"] },
  { prefix: "ground/status", methods: ["GET"], exact: true },
  { prefix: "ground/range", methods: ["GET"], exact: true },
];

const SEGMENT = /^[A-Za-z0-9._~-]+$/;

function isAllowed(path: string, method: Method): boolean {
  return ALLOWED.some(
    (a) => a.methods.includes(method) && (path === a.prefix || (!a.exact && path.startsWith(a.prefix + "/")))
  );
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function forward(method: Method, path: string, search: string, body: string | undefined, token: string) {
  return fetch(`${TRACKER_URL}/api/${path}${search}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...TRACKER_ORIGIN_HEADERS,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body,
    cache: "no-store",
  });
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const method = req.method as Method;
  const { path: segments } = await ctx.params;

  if (!segments?.length || segments.some((s) => !SEGMENT.test(s) || s === "." || s === "..")) {
    return json({ detail: "Not found" }, 404);
  }
  const path = segments.join("/");

  // Tracker liveness, no account needed.
  if (path === "health" && method === "GET") {
    try {
      const res = await fetch(`${TRACKER_URL}/health`, { cache: "no-store" });
      return json({ ok: res.ok }, res.ok ? 200 : 502);
    } catch {
      return json({ ok: false }, 502);
    }
  }

  if (!isAllowed(path, method)) return json({ detail: "Not found" }, 404);

  // Writes must come from the app's own fetch calls. A custom header cannot be
  // sent cross-site without a CORS preflight, which this route never grants.
  if (method !== "GET" && req.headers.get("x-fp-app") !== "1") {
    return json({ detail: "Forbidden" }, 403);
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return json({ detail: "Not signed in" }, 401);

  const body = method === "GET" || method === "DELETE" ? undefined : await req.text();
  const search = req.nextUrl.search;

  let token = unpackTrackerCookie(email, req.cookies.get(TRACKER_COOKIE)?.value);
  let minted = false;

  try {
    if (!token) {
      token = await mintTrackerToken(email);
      minted = true;
    }

    let res = await forward(method, path, search, body, token);

    if (res.status === 401) {
      const detail = (await res.clone().json().catch(() => ({})))?.detail;
      if (detail === "license_expired") return json({ detail: "license_expired" }, 402);
      // The stored token expired or was rejected: get a new one and try once more.
      if (!minted) {
        token = await mintTrackerToken(email);
        minted = true;
        res = await forward(method, path, search, body, token);
        if (res.status === 401) {
          const again = (await res.clone().json().catch(() => ({})))?.detail;
          if (again === "license_expired") return json({ detail: "license_expired" }, 402);
        }
      }
    }

    const text = await res.text();
    const out = new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
    if (minted && token) {
      out.cookies.set(TRACKER_COOKIE, packTrackerCookie(email, token), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/tracker",
        maxAge: TRACKER_COOKIE_MAX_AGE,
      });
    }
    return out;
  } catch (e) {
    if (e instanceof TrackerAuthError) {
      if (e.code === "license_expired") return json({ detail: "license_expired" }, 402);
      if (e.code === "no_account") return json({ detail: "Not signed in" }, 401);
    }
    return json({ detail: "tracker_unavailable" }, 502);
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
