"use client";

import { useState } from "react";

type PasswordErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  auth?: string;
};

type PasswordResponse = {
  errors?: PasswordErrors;
};

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [errors, setErrors] = useState<PasswordErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrors({});

    const response = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as PasswordResponse | null;
      setErrors(payload?.errors ?? { auth: "Password gagal diperbarui." });
      setStatus("error");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus("success");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="current-password"
        label="Password saat ini"
        value={currentPassword}
        onChange={setCurrentPassword}
        error={errors.currentPassword}
      />
      <PasswordField
        id="new-password"
        label="Password baru"
        value={newPassword}
        onChange={setNewPassword}
        error={errors.newPassword}
      />
      <PasswordField
        id="confirm-password"
        label="Konfirmasi password baru"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={errors.confirmPassword}
      />

      {errors.auth ? (
        <p className="text-sm font-semibold text-rose-700">{errors.auth}</p>
      ) : null}
      {status === "success" ? (
        <p className="text-sm font-semibold text-emerald-700">
          Password berhasil diperbarui. Sesi lain sudah dicabut.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
      >
        {status === "saving" ? "Menyimpan..." : "Ubah password"}
      </button>
    </form>
  );
}

function PasswordField(input: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={input.id} className="text-sm font-semibold text-slate-950">
        {input.label}
      </label>
      <input
        id={input.id}
        type="password"
        value={input.value}
        onChange={(event) => input.onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        autoComplete="off"
      />
      {input.error ? (
        <p className="mt-2 text-xs font-semibold text-rose-700">
          {input.error}
        </p>
      ) : null}
    </div>
  );
}
