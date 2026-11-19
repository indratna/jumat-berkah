"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { extractOrderId } from "@/lib/order-lookup";

export function OrderLookupForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const orderId = extractOrderId(value);

    if (!orderId) {
      setError(
        "Order ID tidak valid. Formatnya seperti JB-20261119-ABCD1234, atau tempel tautan status donasi.",
      );
      return;
    }

    setError(null);
    router.push(`/donasi/status/${encodeURIComponent(orderId)}`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="order-id"
          className="text-sm font-semibold text-[color:var(--craft-ink)]"
        >
          Order ID
        </label>
        <input
          id="order-id"
          name="order-id"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "order-id-error" : "order-id-hint"}
          className={`field mt-2 font-mono uppercase ${
            error ? "border-red-700" : ""
          }`}
          placeholder="JB-20261119-ABCD1234"
        />
        {error ? (
          <p
            id="order-id-error"
            role="alert"
            className="mt-2 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        ) : (
          <p
            id="order-id-hint"
            className="mt-2 text-xs leading-5 text-[color:var(--craft-ink-soft)]"
          >
            Bisa juga menempel tautan status dari pesan konfirmasi.
          </p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] transition hover:bg-[color:var(--craft-leaf-strong)] sm:w-auto sm:px-6"
      >
        Cek status donasi
      </button>
    </form>
  );
}