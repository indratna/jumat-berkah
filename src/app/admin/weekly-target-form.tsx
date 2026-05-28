"use client";

import { useState } from "react";

type Props = {
  cycleStart: string;
  cycleEnd: string;
  initialTargetAmount: number | null;
  initialNote: string | null;
};

export function WeeklyTargetForm({
  cycleStart,
  cycleEnd,
  initialTargetAmount,
  initialNote,
}: Props) {
  const [targetAmount, setTargetAmount] = useState(
    initialTargetAmount ? String(initialTargetAmount) : "",
  );
  const [note, setNote] = useState(initialNote ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    const parsed = Number(targetAmount.replace(/\D/g, ""));
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setStatus("error");
      setErrorMessage("Target dana harus lebih besar dari 0.");
      return;
    }

    const response = await fetch("/api/admin/weekly-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cycleStart,
        targetAmount: parsed,
        note: note.trim() ? note.trim() : null,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        errors?: Record<string, string>;
      } | null;
      const errorText =
        data?.errors?.targetAmount ??
        data?.errors?.cycleStart ??
        data?.errors?.note ??
        data?.errors?.auth ??
        "Gagal menyimpan target.";
      setStatus("error");
      setErrorMessage(errorText);
      return;
    }

    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-xl bg-green-50 p-3 text-xs text-slate-700">
        <p>
          Periode siklus: <strong>{cycleStart}</strong> sampai{" "}
          <strong>{cycleEnd}</strong>
        </p>
      </div>
      <label className="block text-sm font-semibold">
        Target dana (Rupiah)
        <input
          type="text"
          inputMode="numeric"
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
          className="field mt-2"
          placeholder="500000"
          required
        />
      </label>
      <label className="block text-sm font-semibold">
        Catatan (opsional)
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={200}
          className="field mt-2"
          placeholder="Contoh: target 100 nasi bungkus."
        />
      </label>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white disabled:bg-slate-300"
      >
        {status === "saving" ? "Menyimpan…" : "Simpan target"}
      </button>
      {status === "saved" ? (
        <p className="text-sm font-semibold text-green-700">
          Target tersimpan untuk siklus ini.
        </p>
      ) : null}
      {status === "error" && errorMessage ? (
        <p className="text-sm font-semibold text-rose-700">{errorMessage}</p>
      ) : null}
    </form>
  );
}
