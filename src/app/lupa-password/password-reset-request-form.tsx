"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="reset-email" className="text-sm font-semibold">
          Email akun
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field mt-2"
          required
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary w-full disabled:bg-slate-300"
      >
        {status === "sending" ? "Mengirim…" : "Kirim tautan reset"}
      </button>
      {status === "sent" ? (
        <p className="text-sm font-semibold text-green-700">
          Jika email terdaftar, tautan reset sudah dikirim. Local development:
          cek terminal `run.bat` untuk URL reset.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm font-semibold text-rose-700">
          Permintaan reset gagal. Coba lagi.
        </p>
      ) : null}
    </form>
  );
}
