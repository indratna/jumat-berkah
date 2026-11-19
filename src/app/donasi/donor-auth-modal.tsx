"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { authClient } from "@/lib/auth-client";

type AuthMode = "login" | "signup";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function DonorAuthModalTrigger() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(false);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  function openModal(nextMode: AuthMode) {
    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setMode(nextMode);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    // Return focus to the trigger once the portal has unmounted.
    window.requestAnimationFrame(() => previouslyFocused.current?.focus());
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openModal("login")}
          className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-4 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => openModal("signup")}
          className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-4 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
        >
          Daftar
        </button>
      </div>
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <DonorAuthModal
              mode={mode}
              onModeChange={setMode}
              onClose={closeModal}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function DonorAuthModal({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Move focus into the dialog so keyboard and screen reader users land here.
    const node = dialogRef.current;
    const initialFocus = node?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initialFocus?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !node) {
        return;
      }

      const focusable = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="landing-craft fixed inset-0 z-50 grid place-items-center overflow-hidden !bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donor-auth-title"
      aria-describedby="donor-auth-description"
    >
      <div
        ref={dialogRef}
        className="craft-card-strong max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-[color:var(--craft-leaf)]">
              Akun donatur
            </p>
            <h2
              id="donor-auth-title"
              className="mt-2 text-2xl font-extrabold text-[color:var(--craft-ink)]"
            >
              {mode === "login" ? "Masuk akun donatur" : "Daftar akun donatur"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-[color:var(--craft-line-strong)] text-lg font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            aria-label="Tutup popup akun donatur"
          >
            ×
          </button>
        </div>

        <p
          id="donor-auth-description"
          className="mt-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]"
        >
          Akun bersifat opsional. Fungsinya menyimpan riwayat donasi; berdonasi
          tetap bisa tanpa login.
        </p>

        {mode === "login" ? (
          <LoginPanel onSwitchToSignup={() => onModeChange("signup")} />
        ) : (
          <SignupPanel onSwitchToLogin={() => onModeChange("login")} />
        )}
      </div>
    </div>
  );
}

function LoginPanel({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleLogin() {
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/donasi",
      errorCallbackURL: "/donasi",
      newUserCallbackURL: "/donasi",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: "/donasi",
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

    window.location.href = "/donasi";
  }

  return (
    <div className="mt-6 space-y-6">
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full min-h-11 rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-5 py-3 font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
      >
        Masuk dengan Google
      </button>
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="modal-login-email"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Email
          </label>
          <input
            id="modal-login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-2"
            required
          />
        </div>
        <div>
          <label
            htmlFor="modal-login-password"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Password
          </label>
          <input
            id="modal-login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-2"
            required
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:bg-slate-300"
        >
          {isSubmitting ? "Masuk…" : "Masuk"}
        </button>
      </form>
      <p className="text-center text-sm text-[color:var(--craft-ink-soft)]">
        Belum punya akun?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-bold text-[color:var(--craft-leaf)]"
        >
          Daftar
        </button>
      </p>
    </div>
  );
}

function SignupPanel({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleSignup() {
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/donasi",
      errorCallbackURL: "/donasi",
      newUserCallbackURL: "/donasi",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      callbackURL: "/donasi",
    });

    if (signUpError) {
      setError("Pendaftaran gagal. Cek email dan password, lalu coba lagi.");
      setIsSubmitting(false);
      return;
    }

    window.location.href = `/cek-email?email=${encodeURIComponent(trimmedEmail)}&next=${encodeURIComponent("/donasi")}`;
  }

  return (
    <div className="mt-6 space-y-6">
      <button
        type="button"
        onClick={handleGoogleSignup}
        className="w-full min-h-11 rounded-full border border-[color:var(--craft-line-strong)] bg-[color:var(--craft-paper)] px-5 py-3 font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
      >
        Daftar dengan Google
      </button>
      <Divider />
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="modal-signup-name"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Nama
          </label>
          <input
            id="modal-signup-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field mt-2"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label
            htmlFor="modal-signup-email"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Email
          </label>
          <input
            id="modal-signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-2"
            required
          />
        </div>
        <div>
          <label
            htmlFor="modal-signup-password"
            className="text-sm font-semibold text-[color:var(--craft-ink)]"
          >
            Password
          </label>
          <input
            id="modal-signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-2"
            minLength={8}
            maxLength={128}
            required
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:bg-slate-300"
        >
          {isSubmitting ? "Mendaftar…" : "Daftar akun donatur"}
        </button>
      </form>
      <p className="text-center text-sm text-[color:var(--craft-ink-soft)]">
        Sudah punya akun?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-[color:var(--craft-leaf)]"
        >
          Masuk
        </button>
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--craft-ink-soft)]">
      <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
      atau
      <span className="h-px flex-1 bg-[color:var(--craft-line)]" />
    </div>
  );
}
