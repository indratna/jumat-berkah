import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compare two secrets without leaking their length or content through timing.
 *
 * Both values are hashed to a fixed 32-byte digest first, so the final
 * comparison always runs on equal-length buffers. Missing values never match.
 */
export function timingSafeEqualString(
  received: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (typeof received !== "string" || typeof expected !== "string") {
    return false;
  }

  const receivedHash = createHash("sha256").update(received, "utf8").digest();
  const expectedHash = createHash("sha256").update(expected, "utf8").digest();

  return timingSafeEqual(receivedHash, expectedHash);
}