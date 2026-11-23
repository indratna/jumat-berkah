"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function DonorAuthLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await Promise.allSettled([
      fetch("/api/auth/donor/logout", { method: "POST" }),
      authClient.signOut(),
    ]);
    // Staying on /donasi means a push to the same URL would not refetch the RSC
    // that decides which banner to show. Refresh makes the cleared cookie visible.
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
    >
      Logout
    </button>
  );
}
