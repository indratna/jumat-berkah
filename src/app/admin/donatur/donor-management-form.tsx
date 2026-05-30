"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminDonor } from "@/lib/admin";

type DonorManagementFormProps = {
  donor: AdminDonor;
};

export function DonorManagementForm({ donor }: DonorManagementFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus("saving");
    setError(null);

    const labels = String(formData.get("labels") ?? "")
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);

    const response = await fetch(
      `/api/admin/donors/${encodeURIComponent(donor.key)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.get("displayName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          whatsappReminderOptIn:
            formData.get("whatsappReminderOptIn") === "on",
          internalNote: formData.get("internalNote"),
          labels,
        }),
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        errors?: Record<string, string>;
      } | null;
      setStatus("error");
      setError(
        payload?.errors
          ? Object.values(payload.errors).join(" ")
          : "Profil donatur gagal disimpan.",
      );
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="kicker">Kelola Donatur</p>
        <h3 className="mt-2 font-semibold text-slate-950">
          Profil operasional admin
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Data ini hanya untuk admin. Donasi dan status pembayaran tidak diubah.
        </p>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Nama operasional
        <input
          name="displayName"
          defaultValue={donor.name}
          className="field mt-1"
          maxLength={100}
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Email operasional
        <input
          name="email"
          type="email"
          defaultValue={donor.email ?? ""}
          className="field mt-1"
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        WhatsApp operasional
        <input
          name="phone"
          defaultValue={donor.phone ?? ""}
          className="field mt-1"
          inputMode="tel"
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <input
          name="whatsappReminderOptIn"
          type="checkbox"
          defaultChecked={donor.whatsappReminderOptIn}
          className="mt-1"
        />
        <span>
          Izinkan pengingat WhatsApp untuk donatur ini. Nomor WhatsApp wajib
          terisi.
        </span>
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Catatan internal
        <textarea
          name="internalNote"
          defaultValue={donor.internalNote ?? ""}
          className="field mt-1 min-h-28"
          maxLength={2000}
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Label donatur
        <input
          name="labels"
          defaultValue={donor.labels.join(", ")}
          className="field mt-1"
          placeholder="Rutin, VIP, Follow-up"
        />
      </label>

      {status === "error" && error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
      {status === "saved" ? (
        <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          Profil donatur tersimpan.
        </p>
      ) : null}

      <button className="btn-primary w-full" disabled={status === "saving"}>
        {status === "saving" ? "Menyimpan..." : "Simpan profil donatur"}
      </button>
    </form>
  );
}
