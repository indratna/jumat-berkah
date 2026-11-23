"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function DonorLogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await Promise.allSettled([
      fetch("/api/auth/donor/logout", { method: "POST" }),
      authClient.signOut(),
    ]);
    // Legacy donor_session and the Better Auth session are both cleared here;
    // a full load guarantees the guarded account RSC is refetched as a guest.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isSubmitting}
      className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-green-700 disabled:opacity-60"
    >
      {isSubmitting ? "Keluar…" : "Keluar"}
    </button>
  );
}
