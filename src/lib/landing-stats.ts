export type DonationIdentityRow = {
  id: string;
  userId: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  donorName: string | null;
  isAnonymous: boolean;
  showNamePublicly: boolean;
};

/**
 * Best-effort identity key for counting donors without exposing contact data.
 * Anonymous rows without any identity fall back to the donation id so repeat
 * anonymous donors cannot be merged incorrectly.
 */
export function buildPublicDonorIdentity(row: DonationIdentityRow): string {
  if (row.userId) {
    return `user:${row.userId}`;
  }

  const email = row.donorEmail?.trim().toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  const phone = row.donorPhone?.replace(/\D/g, "");
  if (phone) {
    return `phone:${phone}`;
  }

  const name = row.donorName?.trim().toLowerCase();
  if (name && row.showNamePublicly && !row.isAnonymous) {
    return `name:${name}`;
  }

  return `donation:${row.id}`;
}

export function countDistinctDonors(rows: DonationIdentityRow[]): number {
  return new Set(rows.map(buildPublicDonorIdentity)).size;
}

export function formatRelativeTime(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 60_000) {
    return "Baru saja";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes} menit lalu`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} jam lalu`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} hari lalu`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}