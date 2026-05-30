export type DonorProfilePayload = {
  displayName?: unknown;
  email?: unknown;
  phone?: unknown;
  whatsappReminderOptIn?: unknown;
  internalNote?: unknown;
  labels?: unknown;
};

export type DonorProfileData = {
  displayName: string | null;
  email: string | null;
  phone: string | null;
  whatsappReminderOptIn: boolean;
  internalNote: string | null;
  labels: string[];
};

export type DonorProfileValidationResult =
  | { success: true; data: DonorProfileData }
  | { success: false; errors: Record<string, string> };

export function validateDonorProfilePayload(
  payload: DonorProfilePayload,
): DonorProfileValidationResult {
  const errors: Record<string, string> = {};
  const displayName = normalizeOptionalText(payload.displayName, 100);
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const internalNote = normalizeOptionalText(payload.internalNote, 2_000);
  const labels = normalizeDonorLabels(
    Array.isArray(payload.labels) ? payload.labels : [],
  );
  const whatsappReminderOptIn = payload.whatsappReminderOptIn === true;

  if (displayName === false) errors.displayName = "Nama maksimal 100 karakter.";
  if (email === false) errors.email = "Email tidak valid.";
  if (internalNote === false) {
    errors.internalNote = "Catatan maksimal 2.000 karakter.";
  }
  if (labels.length > 10) errors.labels = "Label maksimal 10.";
  if (whatsappReminderOptIn && !phone) {
    errors.phone = "Nomor WhatsApp wajib untuk opt-in pengingat.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      displayName: displayName || null,
      email: email || null,
      phone: phone || null,
      whatsappReminderOptIn,
      internalNote: internalNote || null,
      labels: labels.slice(0, 10),
    },
  };
}

export function normalizeDonorLabels(values: unknown[]) {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const label = value.trim().slice(0, 40);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels;
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return false;
  return trimmed;
}

function normalizeEmail(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return false;
  const email = value.trim().toLowerCase();
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : false;
}

function normalizePhone(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return "";
  return value.replace(/[^0-9+]/g, "");
}
