"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckStatusResult = {
  ok: boolean;
  orderId: string;
  currentStatus: string;
  previousStatus?: string;
  midtransStatus: string;
  mappedStatus: string | null;
  statusUpdated: boolean;
  message: string;
};

export function CheckStatusButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheck() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/donations/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          data?.errors?.midtrans ??
          data?.errors?.orderId ??
          data?.errors?.auth ??
          `Gagal cek status (${response.status})`;
        setError(message);
        return;
      }

      const data = (await response.json()) as CheckStatusResult;
      setResult(data);

      if (data.statusUpdated) {
        router.refresh();
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleCheck}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            Mengecek…
          </>
        ) : (
          "Cek Status"
        )}
      </button>
      {result && !result.statusUpdated && (
        <p className="mt-1 text-xs text-slate-500">{result.message}</p>
      )}
      {result?.statusUpdated && (
        <p className="mt-1 text-xs font-medium text-emerald-600">
          {result.message}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
