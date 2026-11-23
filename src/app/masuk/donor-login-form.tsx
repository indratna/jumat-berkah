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
  const [email, setEmail] = useState(initialEmail);
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
      email: email.trim(),
      password,
      callbackURL: next,
    });

    if (signInError) {
      const errorCode = signInError.code?.toLowerCase() ?? "";
      setError(
        errorCode.includes("email") && errorCode.includes("verified")
          ? "Email belum diverifikasi. Cek email Anda sebelum masuk."
          : "Email atau password tidak valid.",
      );
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

      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--craft-ink-soft)]">
        <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
        atau
        <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
      </div>

      <form onSubmit={handlePasswordSignIn} className="space-y-5">
        <p className="text-sm font-bold uppercase tracking-[0.1em] text-[color:var(--craft-leaf)]">
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
            aria-describedby={error ? "donor-login-error" : undefined}
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
            aria-describedby={error ? "donor-login-error" : undefined}
            className="field mt-2"
            required
          />
        </div>

        {error ? (
          <p id="donor-login-error" role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:bg-slate-200 disabled:text-slate-700"
        >
          {isSubmitting ? "Masuk…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
