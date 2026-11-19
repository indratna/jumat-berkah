const ORDER_ID_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,63}$/;

/**
 * Accepts a bare Order ID or a pasted status URL and returns a normalized Order
 * ID. Anything else is rejected before it reaches the status route.
 */
export function extractOrderId(raw: string): string | null {
  const value = raw.trim();

  if (!value) {
    return null;
  }

  const urlMatch = value.match(/\/donasi\/status\/([^/?#\s]+)/i);
  let candidate = urlMatch ? urlMatch[1] : value;

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return null;
  }

  const normalized = candidate.trim().toUpperCase();

  return ORDER_ID_PATTERN.test(normalized) ? normalized : null;
}