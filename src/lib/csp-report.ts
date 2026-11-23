/**
 * Parsing, sanitizing and deduplication for browser CSP violation reports.
 *
 * Reports are untrusted input from any client. Nothing here logs query strings
 * or inline script samples, which could carry donor data.
 */

export const MAX_CSP_REPORT_BODY_BYTES = 16 * 1024;
export const MAX_DEDUPE_ENTRIES = 500;
export const DEDUPE_TTL_MS = 5 * 60_000;

export type NormalizedCspReport = {
  directive: string;
  blockedUri: string;
  documentUri: string;
  disposition: string;
  lineNumber: number | null;
};

export type CspReportDeduplicator = {
  shouldLog: (report: NormalizedCspReport, now?: number) => boolean;
  reset: () => void;
  size: () => number;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

function safeString(value: unknown, maxLength = 300): string {
  if (typeof value !== "string") {
    return "";
  }

  return truncate(value.replaceAll(/[\u0000-\u001f\u007f]/g, ""), maxLength);
}

/**
 * Keep origin + path only. Query strings and fragments may contain tokens or
 * personal data, and inline data/blob payloads are never useful in a log.
 */
export function sanitizeUri(value: unknown): string {
  const raw = safeString(value);

  if (!raw) {
    return "";
  }

  if (raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw.slice(0, 5);
  }

  try {
    const url = new URL(raw);
    return truncate(`${url.origin}${url.pathname}`, 300);
  } catch {
    // CSP uses bare values such as "inline", "eval", "self" and "".
    return truncate((raw.split("?")[0] ?? "").split("#")[0] ?? "", 100);
  }
}

function readLineNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }

  if (value < 0 || value > 1_000_000) {
    return null;
  }

  return value;
}

function normalizeBody(
  body: UnknownRecord,
  fallbackDocumentUrl: unknown,
): NormalizedCspReport {
  const directive =
    safeString(body.effectiveDirective, 100) ||
    safeString(body.violatedDirective, 100);

  const documentUri =
    sanitizeUri(body.documentURL) ||
    sanitizeUri(body.documentUrl) ||
    sanitizeUri(body["document-uri"]) ||
    sanitizeUri(fallbackDocumentUrl);

  return {
    directive: directive || "(unknown)",
    blockedUri:
      sanitizeUri(body.blockedURL) ||
      sanitizeUri(body.blockedUrl) ||
      sanitizeUri(body["blocked-uri"]) ||
      "(none)",
    documentUri: documentUri || "(unknown)",
    disposition: safeString(body.disposition, 20) || "report",
    lineNumber:
      readLineNumber(body.lineNumber) ??
      readLineNumber(body["line-number"]),
  };
}

function normalizeLegacyReport(report: UnknownRecord): NormalizedCspReport {
  return normalizeBody(
    {
      effectiveDirective: report["effective-directive"],
      violatedDirective: report["violated-directive"],
      blockedURL: report["blocked-uri"],
      documentURL: report["document-uri"],
      disposition: report.disposition,
      lineNumber: report["line-number"],
    },
    undefined,
  );
}

/**
 * Accepts both the modern Reporting API envelope and the legacy csp-report
 * envelope. Malformed entries are skipped rather than thrown so one bad report
 * cannot hide the rest of a batch.
 */
export function normalizeCspReports(rawBody: string): NormalizedCspReport[] {
  let payload: unknown;

  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return [];
  }

  const reports: NormalizedCspReport[] = [];

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (!isRecord(entry) || !isRecord(entry.body)) {
        continue;
      }

      if (
        typeof entry.type === "string" &&
        entry.type !== "csp-violation"
      ) {
        continue;
      }

      reports.push(normalizeBody(entry.body, entry.url));
    }

    return reports;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (isRecord(payload["csp-report"])) {
    reports.push(normalizeLegacyReport(payload["csp-report"]));
    return reports;
  }

  // A few clients send a bare body; accept it when it looks like a CSP report.
  const looksLikeReport =
    "effectiveDirective" in payload ||
    "violatedDirective" in payload ||
    "blockedURL" in payload ||
    "blocked-uri" in payload;

  if (looksLikeReport) {
    reports.push(normalizeBody(payload, undefined));
  }

  return reports;
}

/** Bounded, expiring deduplication so one page cannot flood the log. */
export function createCspReportDeduplicator(): CspReportDeduplicator {
  const seen = new Map<string, number>();

  function pruneExpired(now: number) {
    for (const [key, expiresAt] of seen) {
      if (expiresAt <= now) {
        seen.delete(key);
      }
    }
  }

  return {
    shouldLog(report, now = Date.now()) {
      const key = `${report.directive}|${report.blockedUri}`;
      const expiresAt = seen.get(key);

      if (expiresAt !== undefined && expiresAt > now) {
        return false;
      }

      if (seen.size >= MAX_DEDUPE_ENTRIES) {
        pruneExpired(now);
      }

      // Still full: evict the oldest entry so the map stays bounded even when
      // every entry is inside its window.
      if (seen.size >= MAX_DEDUPE_ENTRIES) {
        const oldest = seen.keys().next().value;
        if (oldest !== undefined) {
          seen.delete(oldest);
        }
      }

      seen.set(key, now + DEDUPE_TTL_MS);
      return true;
    },
    reset() {
      seen.clear();
    },
    size() {
      return seen.size;
    },
  };
}
