"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function DonorLoginForm({
  initialEmail = "",
  next = "/akun/donasi",
}: {
  initialEmail?: string;
  next?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleLogin() {
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: "/masuk",
      newUserCallbackURL: next,
    });
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: next,
    });

    if (signInError) {
      const errorCode = signInError.code?.toLowerCase() ?? "";
      if (errorCode.includes("email") && errorCode.includes("verified")) {
        setError(
          "Email belum diverifikasi. Cek email Anda atau kirim ulang verifikasi dari Better Auth.",
        );
        setIsSubmitting(false);
        return;
      }
      setError("Email atau password tidak valid.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = next;
  }

  async function handleLegacySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/donor/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, loginCode }),
    });

    if (!response.ok) {
      setError("Nama, email, atau kode donatur tidak valid.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = next;
  }

  return (
    <div className="craft-card-strong space-y-6 p-6">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-5 py-3 font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
      >
        Masuk dengan Google
      </button>

      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--craft-ink-soft)]">
        <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
        atau
        <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
      </div>

      <form onSubmit={handlePasswordSignIn} className="space-y-5">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--craft-leaf)]">
          Masuk dengan email
        </p>
        <div>
          <label
            htmlFor="email-password"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Email
          </label>
          <input
            id="email-password"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-2"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-2"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:bg-slate-300"
        >
          {isSubmitting ? "Masuk…" : "Masuk"}
        </button>
      </form>

      <details className="rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper)] p-4 text-sm text-[color:var(--craft-ink-soft)]">
        <summary className="cursor-pointer font-bold text-[color:var(--craft-ink)]">
          Masuk dengan kode donatur lama
        </summary>
        <form onSubmit={handleLegacySubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="legacy-name"
              className="text-sm font-semibold text-[color:var(--craft-ink)]"
            >
              Nama
            </label>
            <input
              id="legacy-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field mt-2"
              required
            />
          </div>
          <div>
            <label
              htmlFor="legacy-email"
              className="text-sm font-semibold text-[color:var(--craft-ink)]"
            >
              Email
            </label>
            <input
              id="legacy-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field mt-2"
              required
            />
          </div>
          <div>
            <label
              htmlFor="loginCode"
              className="text-sm font-semibold text-[color:var(--craft-ink)]"
            >
              Kode donatur
            </label>
            <input
              id="loginCode"
              type="password"
              value={loginCode}
              onChange={(event) => setLoginCode(event.target.value)}
              className="field mt-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-slate-800 px-5 py-3 font-bold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? "Masuk…" : "Masuk dengan kode"}
          </button>
        </form>
      </details>
    </div>
  );
}
