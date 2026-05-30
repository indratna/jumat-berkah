"use client";

import { FormEvent, useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function DonorSignupForm({
  initialEmail,
  initialName,
  next,
}: {
  initialEmail: string;
  initialName: string;
  next: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkEmailUrl = useMemo(
    () => `/cek-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
    [email, next],
  );

  async function handleGoogleSignup() {
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: "/daftar",
      newUserCallbackURL: next,
    });
  }

  async function handleEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length > 80) {
      setError("Nama wajib diisi dan maksimal 80 karakter.");
      setIsSubmitting(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Format email belum valid.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password harus 8–128 karakter.");
      setIsSubmitting(false);
      return;
    }

    const { error: signUpError } = await authClient.signUp.email({
      email: trimmedEmail,
      password,
      name: trimmedName,
      callbackURL: next,
    });

    if (signUpError) {
      setError("Pendaftaran gagal. Cek email dan password, lalu coba lagi.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = `/cek-email?email=${encodeURIComponent(trimmedEmail)}&next=${encodeURIComponent(next)}`;
  }

  return (
    <div className="craft-card-strong space-y-6 p-6">
      <button
        type="button"
        onClick={handleGoogleSignup}
        className="w-full rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-5 py-3 font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
      >
        Daftar dengan Google
      </button>

      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--craft-ink-soft)]">
        <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
        atau
        <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
      </div>

      <form onSubmit={handleEmailSignup} className="space-y-5">
        <div>
          <label htmlFor="signup-name" className="text-sm font-semibold text-[color:var(--craft-ink)]">
            Nama
          </label>
          <input
            id="signup-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field mt-2"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="text-sm font-semibold text-[color:var(--craft-ink)]">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-2"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="text-sm font-semibold text-[color:var(--craft-ink)]">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-2"
            minLength={8}
            maxLength={128}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:bg-slate-300">
          {isSubmitting ? "Mendaftar…" : "Daftar akun donatur"}
        </button>
      </form>

      <p className="text-center text-sm text-[color:var(--craft-ink-soft)]">
        Setelah daftar email/password, buka halaman <a className="font-bold text-[color:var(--craft-leaf)]" href={checkEmailUrl}>cek email</a> untuk verifikasi.
      </p>
    </div>
  );
}
