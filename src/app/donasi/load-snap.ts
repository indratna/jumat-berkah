import { getMidtransSnapScriptSrc } from "./snap-checkout";
import type { SnapWindow } from "./snap-types";

export const SNAP_SCRIPT_ID = "midtrans-snap-js";
export const DEFAULT_SNAP_READY_TIMEOUT_MS = 5_000;

export type SnapScriptConfig = {
  clientKey: string | null;
  isProduction: boolean;
};

export function isSnapReady(currentWindow: Window | undefined): boolean {
  const snapWindow = currentWindow as SnapWindow | undefined;
  return typeof snapWindow?.snap?.pay === "function";
}

/**
 * Single-flight, bounded loader. It never rejects: callers always get a boolean
 * and can fall back to Midtrans' redirect URL when Snap.js is unavailable.
 * Accepting `doc`/`getWindow` keeps the race behavior testable without jsdom.
 */
export function createSnapLoader(input: {
  doc: Document;
  getWindow: () => Window | undefined;
  timeoutMs?: number;
}) {
  let pending: Promise<boolean> | null = null;

  return function loadSnapScript(config: SnapScriptConfig): Promise<boolean> {
    if (!config.clientKey) {
      return Promise.resolve(false);
    }

    if (isSnapReady(input.getWindow())) {
      return Promise.resolve(true);
    }

    if (pending) {
      return pending;
    }

    const script = (() => {
      const existing = input.doc.getElementById(
        SNAP_SCRIPT_ID,
      ) as HTMLScriptElement | null;

      if (existing) {
        return existing;
      }

      const created = input.doc.createElement("script");
      created.id = SNAP_SCRIPT_ID;
      created.src = getMidtransSnapScriptSrc(config.isProduction);
      created.async = true;
      created.dataset.clientKey = config.clientKey;
      input.doc.head.appendChild(created);
      return created;
    })();

    pending = new Promise<boolean>((resolve) => {
      let settled = false;
      const state: { timer?: ReturnType<typeof setTimeout> } = {};

      const finish = (value: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        if (state.timer !== undefined) {
          clearTimeout(state.timer);
        }
        pending = null;
        // A failed script cannot recover; remove it so a retry can start fresh.
        if (!value) {
          script.remove();
        }
        resolve(value);
      };

      script.addEventListener("load", () =>
        finish(isSnapReady(input.getWindow())),
      );
      script.addEventListener("error", () => finish(false));
      state.timer = setTimeout(
        () => finish(false),
        input.timeoutMs ?? DEFAULT_SNAP_READY_TIMEOUT_MS,
      );
    });

    return pending;
  };
}

let browserLoader: ReturnType<typeof createSnapLoader> | null = null;

/** Browser entry point. Safe to import on the server; loading starts on click. */
export function loadSnapScript(config: SnapScriptConfig): Promise<boolean> {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }

  if (!browserLoader) {
    browserLoader = createSnapLoader({
      doc: document,
      getWindow: () => window,
    });
  }

  return browserLoader(config);
}
