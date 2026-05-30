"use client";

import { authClient } from "@/lib/auth-client";

export function DonorAuthLogoutButton() {
  async function handleLogout() {
    await Promise.allSettled([
      fetch("/api/auth/donor/logout", { method: "POST" }),
      authClient.signOut(),
    ]);
    window.location.href = "/donasi";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex min-h-10 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
    >
      Logout
    </button>
  );
}
