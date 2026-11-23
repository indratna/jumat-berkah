import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SNAP_READY_TIMEOUT_MS,
  SNAP_SCRIPT_ID,
  createSnapLoader,
  isSnapReady,
} from "@/app/donasi/load-snap";

type Listener = () => void;

class FakeScript {
  id = "";
  src = "";
  async = false;
  dataset: { clientKey?: string } = {};
  removed = false;
  private listeners = new Map<string, Listener[]>();

  addEventListener(type: string, handler: Listener) {
    const current = this.listeners.get(type) ?? [];
    current.push(handler);
    this.listeners.set(type, current);
  }

  remove() {
    this.removed = true;
  }

  emit(type: string) {
    for (const handler of this.listeners.get(type) ?? []) {
      handler();
    }
  }
}

function createFakeDocument(existing: FakeScript[] = []) {
  return {
    scripts: existing,
    getElementById(id: string) {
      return (
        existing.find((script) => script.id === id && !script.removed) ?? null
      );
    },
    createElement() {
      const script = new FakeScript();
      existing.push(script);
      return script;
    },
    head: {
      appendChild() {
        // The fake registry already records the script.
      },
    },
  };
}

function createFakeWindow() {
  const value = {} as Window & { snap?: { pay: () => void } };
  return {
    value,
    setReady(ready: boolean) {
      if (ready) {
        value.snap = { pay: () => undefined };
      } else {
        delete value.snap;
      }
    },
  };
}

test("loader constants stay stable", () => {
  assert.equal(SNAP_SCRIPT_ID, "midtrans-snap-js");
  assert.equal(DEFAULT_SNAP_READY_TIMEOUT_MS, 5_000);
});

test("isSnapReady requires an actual snap.pay function", () => {
  const fakeWindow = createFakeWindow();
  assert.equal(isSnapReady(fakeWindow.value), false);
  assert.equal(isSnapReady(undefined), false);
  fakeWindow.setReady(true);
  assert.equal(isSnapReady(fakeWindow.value), true);
});

test("missing client key never loads a script", async () => {
  const doc = createFakeDocument();
  const fakeWindow = createFakeWindow();
  const load = createSnapLoader({
    doc: doc as unknown as Document,
    getWindow: () => fakeWindow.value,
  });

  assert.equal(await load({ clientKey: null, isProduction: false }), false);
  assert.equal(doc.scripts.length, 0);
});

test("already-loaded Snap short-circuits", async () => {
  const doc = createFakeDocument();
  const fakeWindow = createFakeWindow();
  fakeWindow.setReady(true);
  const load = createSnapLoader({
    doc: doc as unknown as Document,
    getWindow: () => fakeWindow.value,
  });

  assert.equal(await load({ clientKey: "client-key", isProduction: false }), true);
  assert.equal(doc.scripts.length, 0);
});

test("concurrent loads share one script and one promise", async () => {
  const doc = createFakeDocument();
  const fakeWindow = createFakeWindow();
  const load = createSnapLoader({
    doc: doc as unknown as Document,
    getWindow: () => fakeWindow.value,
  });

  const first = load({ clientKey: "client-key", isProduction: false });
  const second = load({ clientKey: "client-key", isProduction: false });

  assert.equal(first, second);
  assert.equal(doc.scripts.length, 1);

  const script = doc.scripts[0];
  assert.equal(script?.id, SNAP_SCRIPT_ID);
  assert.equal(script?.src, "https://app.sandbox.midtrans.com/snap/snap.js");
  assert.equal(script?.async, true);
  assert.equal(script?.dataset.clientKey, "client-key");

  fakeWindow.setReady(true);
  script?.emit("load");

  assert.equal(await first, true);
  assert.equal(await second, true);
});

test("load event without window.snap resolves false", async () => {
  const doc = createFakeDocument();
  const fakeWindow = createFakeWindow();
  const load = createSnapLoader({
    doc: doc as unknown as Document,
    getWindow: () => fakeWindow.value,
  });

  const pending = load({ clientKey: "client-key", isProduction: true });
  const script = doc.scripts[0];
  assert.equal(script?.src, "https://app.midtrans.com/snap/snap.js");
  script?.emit("load");

  assert.equal(await pending, false);
});

test("error and timeout fall back to false and allow a retry", async () => {
  const doc = createFakeDocument();
  const fakeWindow = createFakeWindow();
  const load = createSnapLoader({
    doc: doc as unknown as Document,
    getWindow: () => fakeWindow.value,
    timeoutMs: 20,
  });

  const errored = load({ clientKey: "client-key", isProduction: false });
  doc.scripts[0]?.emit("error");
  assert.equal(await errored, false);
  assert.equal(doc.scripts[0]?.removed, true);

  const timedOut = load({ clientKey: "client-key", isProduction: false });
  assert.equal(doc.scripts.length, 2);
  assert.equal(await timedOut, false);
  assert.equal(doc.scripts[1]?.removed, true);
});

test("an existing script tag is adopted instead of duplicated", async () => {
  const existing = new FakeScript();
  existing.id = SNAP_SCRIPT_ID;
  existing.src = "https://app.sandbox.midtrans.com/snap/snap.js";
  const doc = createFakeDocument([existing]);
  const fakeWindow = createFakeWindow();
  fakeWindow.setReady(true);
  const load = createSnapLoader({
    doc: doc as unknown as Document,
    getWindow: () => fakeWindow.value,
  });

  assert.equal(await load({ clientKey: "client-key", isProduction: false }), true);
  assert.equal(doc.scripts.length, 1);
});
