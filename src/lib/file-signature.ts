export type SupportedFileType = "jpg" | "png" | "webp" | "pdf";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Detect a file type from its first bytes instead of trusting the MIME type
 * supplied by the browser. Returns null for anything we do not serve.
 */
export function detectFileType(bytes: Uint8Array): SupportedFileType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return "jpg";
  }

  if (startsWith(bytes, PNG_SIGNATURE)) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WEBP"
  ) {
    return "webp";
  }

  if (ascii(bytes, 0, 5) === "%PDF-") {
    return "pdf";
  }

  return null;
}

export function matchesExpectedExtension(
  bytes: Uint8Array,
  expectedExtension: SupportedFileType,
): boolean {
  return detectFileType(bytes) === expectedExtension;
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) {
    return false;
  }

  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  if (bytes.length < offset + length) {
    return "";
  }

  let value = "";

  for (let index = offset; index < offset + length; index += 1) {
    value += String.fromCharCode(bytes[index] ?? 0);
  }

  return value;
}