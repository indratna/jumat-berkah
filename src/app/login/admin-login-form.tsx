"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleLogin() {
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/admin",
      errorCallbackURL: "/login",
    });
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/admin",
    });

    if (signInError) {
      setError("Email atau password tidak valid.");
      setIsSubmitting(false);
      return;
    }

    // Better Auth's redirect plugin already hard-navigates via callbackURL.
    // Keeping this explicit fallback avoids relying on router cache after the
    // admin guard previously redirected to /login.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin";
  }

  return (
    <div className="mt-8 space-y-6">
      <form
        onSubmit={handlePasswordLogin}
        className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-inner shadow-slate-900/5"
      >
        <p className="text-sm font-semibold text-slate-800">
          Masuk dengan email dan password
        </p>
        <div>
          <label className="text-sm font-semibold" htmlFor="email-password">
            Email admin
          </label>
          <input
            id="email-password"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full shadow-sm transition hover:-translate-y-0.5 disabled:bg-slate-200 disabled:text-slate-700 disabled:hover:translate-y-0"
        >
          {isSubmitting ? "Masuk…" : "Masuk dengan Password"}
        </button>
        <a
          href="/lupa-password"
          className="block text-center text-sm font-semibold text-green-700 hover:text-slate-950"
        >
          Lupa password?
        </a>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            atau
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="btn-outline w-full transition hover:-translate-y-0.5"
      >
        Masuk dengan Google
      </button>

      {error ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
