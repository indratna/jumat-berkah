/**
 * Static Content-Security-Policy for the report-only baseline.
 *
 * The policy deliberately allows inline scripts and styles because the App
 * Router emits inline bootstrap chunks. Moving to enforcement requires a nonce
 * design first; see docs/CSP_REPORT_ONLY.md.
 */

export const CSP_REPORT_PATH = "/api/csp-report";
export const CSP_REPORT_ENDPOINT_NAME = "csp-endpoint";

const MIDTRANS_APP_ORIGINS = [
  "https://app.midtrans.com",
  "https://app.sandbox.midtrans.com",
] as const;

const MIDTRANS_API_ORIGINS = [
  "https://api.midtrans.com",
  "https://api.sandbox.midtrans.com",
] as const;

export function buildCspReportOnlyPolicy(input: { isDev: boolean }): string {
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    ...MIDTRANS_APP_ORIGINS,
    ...(input.isDev ? ["'unsafe-eval'"] : []),
  ];

  const connectSources = [
    "'self'",
    ...MIDTRANS_APP_ORIGINS,
    ...MIDTRANS_API_ORIGINS,
  ];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    `frame-src ${MIDTRANS_APP_ORIGINS.join(" ")}`,
    "manifest-src 'self'",
    `report-uri ${CSP_REPORT_PATH}`,
    `report-to ${CSP_REPORT_ENDPOINT_NAME}`,
  ].join("; ") + ";";
}

export function buildReportingEndpointsHeader(): string {
  return `${CSP_REPORT_ENDPOINT_NAME}="${CSP_REPORT_PATH}"`;
}
