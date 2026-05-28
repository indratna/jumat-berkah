"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { DistributionReportRecord } from "@/lib/distribution-report";

type Props = {
  cycleStart: string;
  initial: DistributionReportRecord | null;
};

const PHOTO_LIMIT = 6;

export function DistributionReportForm({ cycleStart, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [packageCount, setPackageCount] = useState(
    initial?.packageCount !== null && initial?.packageCount !== undefined
      ? String(initial.packageCount)
      : "",
  );
  const [locationSummary, setLocationSummary] = useState(
    initial?.locationSummary ?? "",
  );
  const [photoUrlsText, setPhotoUrlsText] = useState(
    initial?.photoUrls.join("\n") ?? "",
  );
  const [publish, setPublish] = useState(Boolean(initial?.publishedAt));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    const photoUrls = photoUrlsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (photoUrls.length > PHOTO_LIMIT) {
      setStatus("error");
      setErrorMessage(`Maksimal ${PHOTO_LIMIT} URL foto.`);
      return;
    }

    const parsedPackageCount = packageCount.trim()
      ? Number.parseInt(packageCount.replace(/\D/g, ""), 10)
      : null;

    const response = await fetch("/api/admin/distribution-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cycleStart,
        title: title.trim(),
        summary: summary.trim(),
        packageCount: parsedPackageCount,
        locationSummary: locationSummary.trim() || null,
        photoUrls,
        publish,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        errors?: Record<string, string>;
      } | null;
      const errorText =
        data?.errors?.title ??
        data?.errors?.summary ??
        data?.errors?.cycleStart ??
        data?.errors?.photoUrls ??
        data?.errors?.locationSummary ??
        data?.errors?.packageCount ??
        data?.errors?.auth ??
        "Gagal menyimpan cerita.";
      setStatus("error");
      setErrorMessage(errorText);
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900">
        <p className="font-semibold">Panduan privasi penerima manfaat</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Hindari menampilkan wajah penerima manfaat tanpa izin.</li>
          <li>
            Foto kegiatan/paket lebih disarankan daripada foto identitas
            pribadi.
          </li>
          <li>
            URL foto harus publik (https/http). Jangan unggah data privat
            donatur ke storage publik.
          </li>
        </ul>
      </div>

      <label className="block text-sm font-semibold">
        Judul cerita
        <input
          type="text"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
          required
        />
      </label>

      <label className="block text-sm font-semibold">
        Ringkasan (max 1500 karakter)
        <textarea
          value={summary}
          maxLength={1500}
          rows={6}
          onChange={(event) => setSummary(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Jumlah paket (opsional)
          <input
            type="text"
            inputMode="numeric"
            value={packageCount}
            onChange={(event) => setPackageCount(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
          />
        </label>

        <label className="block text-sm font-semibold">
          Lokasi (opsional)
          <input
            type="text"
            value={locationSummary}
            maxLength={200}
            onChange={(event) => setLocationSummary(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Mis: Masjid belakang kantor"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold">
        URL foto publik (satu URL per baris, max {PHOTO_LIMIT})
        <textarea
          value={photoUrlsText}
          rows={4}
          onChange={(event) => setPhotoUrlsText(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700 font-mono text-xs"
          placeholder="https://contoh.com/foto1.jpg"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={publish}
          onChange={(event) => setPublish(event.target.checked)}
          className="size-4"
        />
        Publish cerita ini ke laporan publik
      </label>

      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white disabled:bg-emerald-300"
      >
        {status === "saving" ? "Menyimpan..." : "Simpan cerita"}
      </button>
      {status === "saved" ? (
        <p className="text-sm font-semibold text-emerald-700">
          Cerita tersimpan untuk siklus ini.
        </p>
      ) : null}
      {status === "error" && errorMessage ? (
        <p className="text-sm font-semibold text-rose-700">{errorMessage}</p>
      ) : null}
    </form>
  );
}
