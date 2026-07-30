import type { NextConfig } from "next";

// Security headers applied to every response. These are defense-in-depth:
// they shrink the blast radius of any XSS, block clickjacking, force HTTPS,
// and stop MIME-sniffing / referrer leakage.
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains. Safe once the site is
  // HTTPS-only (Vercel serves HTTPS by default).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disallow the site being framed → clickjacking protection.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let browsers guess content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down powerful browser features the app doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
