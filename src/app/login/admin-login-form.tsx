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
        className="w-full rounded-full border border-emerald-200 bg-white px-6 py-3 font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
      >
        Masuk dengan Google
      </button>

      <div className="grid grid-cols-2 rounded-full bg-emerald-50 p-1 text-sm font-semibold text-emerald-900">
        <button
          type="button"
          onClick={() => setMethod("password")}
          className={`rounded-full px-4 py-2 ${method === "password" ? "bg-white shadow-sm" : "text-emerald-700"}`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMethod("legacy")}
          className={`rounded-full px-4 py-2 ${method === "legacy" ? "bg-white shadow-sm" : "text-emerald-700"}`}
        >
          Kode Admin
        </button>
      </div>

      {method === "password" ? (
        <form
          onSubmit={handlePasswordLogin}
          className="space-y-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4"
        >
          <p className="text-sm font-semibold text-emerald-900">
            Masuk dengan email dan password
          </p>
          <div>
            <label className="text-sm font-semibold" htmlFor="email-password">
              Email admin
            </label>
            <input
              id="email-password"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-emerald-200 px-4 py-3 outline-none focus:border-emerald-700"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white disabled:bg-emerald-300"
          >
            {isSubmitting ? "Masuk..." : "Masuk dengan Password"}
          </button>
          <a
            href="/lupa-password"
            className="block text-center text-sm font-semibold text-emerald-800 hover:text-emerald-950"
          >
            Lupa password?
          </a>
        </form>
      ) : (
        <form
          onSubmit={handleLegacySubmit}
          className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-4"
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-slate-800 px-6 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? "Masuk..." : "Masuk dengan Kode Admin"}
          </button>
        </form>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
