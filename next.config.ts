import type { NextConfig } from "next";

import {
  buildCspReportOnlyPolicy,
  buildReportingEndpointsHeader,
} from "./src/lib/csp";

// Baseline hardening headers. The CSP is report-only on purpose: it collects
// would-be violations without blocking Midtrans Snap. See CSP_REPORT_ONLY.md
// for the path to enforcement.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: buildCspReportOnlyPolicy({
      isDev: process.env.NODE_ENV !== "production",
    }),
  },
  { key: "Reporting-Endpoints", value: buildReportingEndpointsHeader() },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;