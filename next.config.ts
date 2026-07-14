import type { NextConfig } from "next";

// CSP applied in production only — dev needs eval/websockets for HMR.
// 'unsafe-inline' is required for Next's inline bootstrap scripts and the
// site's inline styles. PostHog (*.i.posthog.com) is the only external host.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.i.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://m.media-amazon.com",
  "font-src 'self'",
  "connect-src 'self' https://*.i.posthog.com https://api.mapbox.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy", value: csp }]
            : []),
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/groundstationdevices",
        destination: "/groundstationkit",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
