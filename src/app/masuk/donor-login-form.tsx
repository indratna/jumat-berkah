"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function DonorLoginForm() {
  const [method, setMethod] = useState<"signin" | "signup" | "legacy">(
    "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleLogin() {
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/akun/donasi",
      errorCallbackURL: "/masuk",
      newUserCallbackURL: "/akun/donasi",
    });
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/akun/donasi",
    });

    if (signInError) {
      setError("Email atau password tidak valid.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/akun/donasi";
  }

  async function handlePasswordSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: "/akun/donasi",
    });

    if (signUpError) {
      setError(
        "Pendaftaran gagal. Pastikan email valid dan password minimal 8 karakter.",
      );
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/akun/donasi";
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

    window.location.href = "/akun/donasi";
  }

  return (
    <div className="mt-8 space-y-6">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-green-700 shadow-sm transition hover:bg-slate-50"
      >
        Masuk dengan Google
      </button>

      <div className="grid grid-cols-3 rounded-lg bg-slate-50 p-1 text-xs font-semibold text-slate-700 sm:text-sm">
        <button
          type="button"
          onClick={() => setMethod("signin")}
          className={`rounded-lg px-3 py-2 ${method === "signin" ? "bg-white shadow-sm" : "text-green-700"}`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => setMethod("signup")}
          className={`rounded-lg px-3 py-2 ${method === "signup" ? "bg-white shadow-sm" : "text-green-700"}`}
        >
          Daftar
        </button>
        <button
          type="button"
          onClick={() => setMethod("legacy")}
          className={`rounded-lg px-3 py-2 ${method === "legacy" ? "bg-white shadow-sm" : "text-green-700"}`}
        >
          Kode
        </button>
      </div>

      {method === "signin" ? (
        <form
          onSubmit={handlePasswordSignIn}
          className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
        >
          <p className="text-sm font-semibold text-slate-700">
            Masuk dengan email dan password
          </p>
          <div>
            <label className="text-sm font-semibold" htmlFor="email-password">
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
            <label className="text-sm font-semibold" htmlFor="password">
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-700 px-6 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? "Masuk…" : "Masuk"}
          </button>
        </form>
      ) : null}

      {method === "signup" ? (
        <form
          onSubmit={handlePasswordSignUp}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-4"
        >
          <p className="text-sm font-semibold text-slate-700">
            Daftar akun donatur baru
          </p>
          <div>
            <label className="text-sm font-semibold" htmlFor="name">
              Nama
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field mt-2"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field mt-2"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field mt-2"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-700 px-6 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? "Mendaftar…" : "Daftar Donatur"}
          </button>
        </form>
      ) : null}

      {method === "legacy" ? (
        <form
          onSubmit={handleLegacySubmit}
          className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-sm font-semibold text-slate-700">
            Fallback kode donatur sementara
          </p>
          <div>
            <label className="text-sm font-semibold" htmlFor="legacy-name">
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
            <label className="text-sm font-semibold" htmlFor="legacy-email">
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
            <label className="text-sm font-semibold" htmlFor="loginCode">
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
            className="w-full rounded-lg bg-slate-800 px-6 py-3 font-semibold text-white disabled:bg-slate-300"
          >
            {isSubmitting ? "Masuk…" : "Masuk dengan Kode Donatur"}
          </button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
