import type { SupportedFileType } from "@/lib/file-signature";

export const MAX_DISTRIBUTION_PHOTO_SIZE_BYTES = 1_048_576;

const allowedMimeTypes = new Map<string, SupportedFileType>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type PhotoFileLike = {
  name: string;
  size: number;
  type: string;
};

export type DistributionPhotoValidationResult =
  | { success: true }
  | { success: false; error: string };

export function validateDistributionPhotoFile(
  file: PhotoFileLike,
): DistributionPhotoValidationResult {
  if (!allowedMimeTypes.has(file.type)) {
    return {
      success: false,
      error: "Format foto harus JPG, PNG, atau WebP.",
    };
  }

  if (file.size <= 0) {
    return { success: false, error: "File foto tidak boleh kosong." };
  }

  if (file.size > MAX_DISTRIBUTION_PHOTO_SIZE_BYTES) {
    return {
      success: false,
      error: "Ukuran foto maksimal 1 MB.",
    };
  }

  return { success: true };
}

export function buildDistributionPhotoFilename(input: {
  originalName: string;
  randomId: string;
}) {
  const extension = getSafeExtension(input.originalName);
  return `distribution-photo-${input.randomId}.${extension}`;
}

export function getDistributionPhotoExtensionFromMime(
  type: string,
): SupportedFileType | null {
  return allowedMimeTypes.get(type) ?? null;
}

function getSafeExtension(originalName: string) {
  const raw = originalName.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg"].includes(raw)) return "jpg";
  if (["png", "webp"].includes(raw)) return raw;
  return "bin";
}
