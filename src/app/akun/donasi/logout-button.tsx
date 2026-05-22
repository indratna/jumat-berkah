"use client";

import { useState } from "react";

export function DonorLogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await fetch("/api/auth/donor/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isSubmitting}
      className="rounded-full border border-emerald-200 px-5 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-60"
    >
      {isSubmitting ? "Keluar..." : "Keluar"}
    </button>
  );
}
