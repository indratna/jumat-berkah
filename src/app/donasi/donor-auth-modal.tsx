"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import dynamic from "next/dynamic";

import type { AuthMode } from "./donor-auth-modal-panel";

// Only the portal and its form panels are lazy-loaded. The two trigger buttons
// below stay in the initial HTML so the donor can open the dialog immediately.
const DonorAuthModal = dynamic(
  () => import("./donor-auth-modal-panel").then((mod) => mod.DonorAuthModal),
  { ssr: false },
);

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
