"use client";

import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, loginCode }),
    });

    if (!response.ok) {
      setError("Email atau kode admin tidak valid.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="text-sm font-semibold" htmlFor="email">
          Email admin
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
          required
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="loginCode">
          Kode admin
        </label>
        <input
          id="loginCode"
          type="password"
          value={loginCode}
          onChange={(event) => setLoginCode(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
          required
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white disabled:bg-emerald-300"
      >
        {isSubmitting ? "Masuk..." : "Masuk Admin"}
      </button>
    </form>
  );
}
