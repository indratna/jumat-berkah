"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function AdminLoginForm() {
  const [method, setMethod] = useState<"password" | "legacy">("password");
  const [email, setEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
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

    window.location.href = "/admin";
  }

  async function handleLegacySubmit(event: FormEvent<HTMLFormElement>) {
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
    <div className="mt-8 space-y-6">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="btn-outline w-full"
      >
        Masuk dengan Google
      </button>

      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-bold text-slate-700">
        <button
          type="button"
          onClick={() => setMethod("password")}
          className={`rounded-lg px-4 py-2 ${method === "password" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMethod("legacy")}
          className={`rounded-lg px-4 py-2 ${method === "legacy" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
        >
          Kode Admin
        </button>
      </div>

      {method === "password" ? (
        <form
          onSubmit={handlePasswordLogin}
          className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
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
              className="field mt-2"
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
              className="field mt-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full disabled:bg-slate-300"
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
      ) : (
        <form
          onSubmit={handleLegacySubmit}
          className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-sm font-semibold text-slate-700">
            Fallback kode admin sementara
          </p>
          <div>
            <label className="text-sm font-semibold" htmlFor="email">
              Email admin
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field mt-2"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="loginCode">
              Kode admin
            </label>
            <input
              id="loginCode"
              name="loginCode"
              type="password"
              autoComplete="off"
              value={loginCode}
              onChange={(event) => setLoginCode(event.target.value)}
              className="field mt-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-700 px-6 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? "Masuk…" : "Masuk dengan Kode Admin"}
          </button>
        </form>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
