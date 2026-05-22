"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
    >
      Keluar
    </button>
  );
}
