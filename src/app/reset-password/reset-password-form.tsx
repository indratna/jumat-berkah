"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setStatus("error");
      setError("Token reset tidak tersedia.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      setStatus("error");
      setError("Password baru harus 8-128 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setStatus("saving");
    const { error: resetError } = await authClient.resetPassword({
      token,
      newPassword,
    });

    if (resetError) {
      setStatus("error");
      setError("Reset password gagal. Token mungkin sudah dipakai atau kedaluwarsa.");
      return;
    }

    setStatus("success");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="new-password" className="text-sm font-semibold">
          Password baru
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
          required
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="text-sm font-semibold">
          Konfirmasi password baru
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
          required
        />
      </div>
      <button
        type="submit"
        disabled={status === "saving" || !token}
        className="w-full rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white disabled:bg-emerald-300"
      >
        {status === "saving" ? "Menyimpan..." : "Simpan password baru"}
      </button>
      {status === "success" ? (
        <p className="text-sm font-semibold text-emerald-700">
          Password berhasil direset. Silakan masuk dengan password baru.
        </p>
      ) : null}
      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    </form>
  );
}
