/**
 * Best-effort client IP for rate limiting.
 *
 * The app runs behind Cloudflare Tunnel and a reverse proxy, so the first
 * trusted header wins. These headers are only trustworthy when the app is not
 * directly exposed; the production deployment keeps it behind the tunnel.
 */
export function getClientIp(request: Request): string | null {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    firstHeaderValue(request.headers.get("x-forwarded-for")),
    request.headers.get("x-real-ip"),
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();

    if (value) {
      return value.slice(0, 64);
    }
  }

  return null;
}

export function firstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const first = value.split(",")[0]?.trim();
  return first || null;
}

/**
 * A request is cross-site only when the browser sent an Origin that does not
 * match any host we trust. Requests without Origin (server-to-server, cron,
 * curl) are left alone so operational tooling keeps working.
 */
export function isCrossSiteOrigin(input: {
  origin: string | null;
  allowedHosts: Array<string | null | undefined>;
}): boolean {
  if (!input.origin) {
    return false;
  }

  if (input.origin === "null") {
    return true;
  }

  let originHost: string;

  try {
    originHost = new URL(input.origin).host.toLowerCase();
  } catch {
    return true;
  }

  const allowed = input.allowedHosts
    .filter((host): host is string => typeof host === "string")
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0);

  if (allowed.length === 0) {
    // Never block when the deployment has not told us its host, otherwise a
    // proxy that strips headers would break every admin mutation.
    return false;
  }

  return !allowed.includes(originHost);
}

export function hostFromUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}