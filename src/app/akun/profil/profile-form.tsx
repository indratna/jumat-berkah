"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileFormProps = {
  initialName: string;
};

type ProfileResponse = {
  errors?: {
    name?: string;
    auth?: string;
    form?: string;
  };
};

export function ProfileForm({ initialName }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as ProfileResponse | null;
      setStatus("error");
      setError(
        payload?.errors?.name ??
          payload?.errors?.auth ??
          payload?.errors?.form ??
          "Profil gagal diperbarui.",
      );
      return;
    }

    setStatus("success");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="text-sm font-semibold text-emerald-950"
        >
          Nama tampilan
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          placeholder="Nama tampilan"
        />
        <p className="mt-2 text-xs text-emerald-900/60">
          Email tidak dapat diubah dari halaman ini agar akses admin/donor tetap
          aman.
        </p>
      </div>

      {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
      {status === "success" ? (
        <p className="text-sm font-semibold text-emerald-700">
          Profil berhasil diperbarui.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {status === "saving" ? "Menyimpan..." : "Simpan profil"}
      </button>
    </form>
  );
}
