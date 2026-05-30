"use client";

import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  async function handleLogout() {
    await Promise.allSettled([
      fetch("/api/auth/admin/logout", { method: "POST" }),
      authClient.signOut(),
    ]);
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
    >
      Keluar
    </button>
  );
}
