"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminDonor } from "@/lib/admin";

type DonorMergeFormProps = {
  donor: AdminDonor;
};

export function DonorMergeForm({ donor }: DonorMergeFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus("saving");
    setError(null);

    const response = await fetch("/api/admin/donors/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primaryDonorKey: donor.key,
        duplicateDonorKey: formData.get("duplicateDonorKey"),
        confirmation: formData.get("confirmation"),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        errors?: Record<string, string>;
      } | null;
      setStatus("error");
      setError(
        payload?.errors
          ? Object.values(payload.errors).join(" ")
          : "Gabung donatur gagal.",
      );
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div>
        <p className="kicker">Duplikat</p>
        <h3 className="mt-2 font-semibold text-slate-950">
          Gabungkan metadata donatur
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Donatur utama: <span className="font-semibold">{donor.key}</span>.
          Proses ini hanya menggabungkan profil, label, dan catatan. Data donasi
          dan pembayaran tidak diubah.
        </p>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Donor key duplikat
        <input
          name="duplicateDonorKey"
          className="field mt-1"
          placeholder="email:duplikat@example.com"
          required
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Frasa konfirmasi
        <input
          name="confirmation"
          className="field mt-1"
          placeholder="GABUNG DONATUR"
          required
        />
      </label>

      {status === "error" && error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
      {status === "saved" ? (
        <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          Metadata donatur berhasil digabung.
        </p>
      ) : null}

      <button className="btn-outline w-full" disabled={status === "saving"}>
        {status === "saving" ? "Menggabungkan..." : "Gabungkan duplikat"}
      </button>
    </form>
  );
}
