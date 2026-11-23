import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildDonationStatusUrl,
  canUseSnapPopup,
  chooseDonationHandoff,
  getMidtransSnapScriptSrc,
  resolveFallbackRedirect,
  resolveSnapCallbackDestination,
} from "@/app/donasi/snap-checkout";

test("resolveSnapCallbackDestination always returns donation status page for popup callbacks", () => {
  const orderId = "DON-123";

  assert.equal(buildDonationStatusUrl(orderId), "/donasi/status/DON-123");
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "success" }),
    "/donasi/status/DON-123",
  );
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "pending" }),
    "/donasi/status/DON-123",
  );
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "error" }),
    "/donasi/status/DON-123",
  );
  assert.equal(
    resolveSnapCallbackDestination({ orderId, callback: "close" }),
    "/donasi/status/DON-123",
  );
});

test("canUseSnapPopup requires both snap token and window.snap.pay", () => {
  const payment = {
    snapToken: "snap-token-123",
    redirectUrl: "https://app.midtrans.com/redirect",
  };

  assert.equal(canUseSnapPopup(payment, undefined), false);
  assert.equal(canUseSnapPopup(payment, {} as Window), false);
  assert.equal(
    canUseSnapPopup(payment, {
      snap: { pay: () => undefined },
    } as unknown as Window),
    true,
  );
  assert.equal(
    canUseSnapPopup({ snapToken: "", redirectUrl: payment.redirectUrl }, {
      snap: { pay: () => undefined },
    } as unknown as Window),
    false,
  );
});

test("resolveFallbackRedirect prefers redirect url and falls back to status page", () => {
  assert.equal(
    resolveFallbackRedirect({
      payment: {
        snapToken: "snap-token-123",
        redirectUrl: "https://app.midtrans.com/redirect",
      },
      orderId: "DON-456",
    }),
    "https://app.midtrans.com/redirect",
  );

  assert.equal(
    resolveFallbackRedirect({ payment: undefined, orderId: "DON-456" }),
    "/donasi/status/DON-456",
  );
});

test("Snap script URL selects sandbox or production", () => {
  assert.equal(
    getMidtransSnapScriptSrc(false),
    "https://app.sandbox.midtrans.com/snap/snap.js",
  );
  assert.equal(
    getMidtransSnapScriptSrc(true),
    "https://app.midtrans.com/snap/snap.js",
  );
});

test("handoff uses popup only when Snap is ready and a token exists", () => {
  const payment = {
    snapToken: "snap-token-123",
    redirectUrl: "https://app.midtrans.com/redirect",
  };

  assert.deepEqual(
    chooseDonationHandoff({ payment, orderId: "DON-1", snapReady: true }),
    { kind: "popup", snapToken: "snap-token-123" },
  );

  // First-click race: the script is still loading, so the redirect must win.
  assert.deepEqual(
    chooseDonationHandoff({ payment, orderId: "DON-1", snapReady: false }),
    { kind: "redirect", url: "https://app.midtrans.com/redirect" },
  );
});

test("handoff falls back to redirect or result card without a usable popup", () => {
  assert.deepEqual(
    chooseDonationHandoff({
      payment: { snapToken: "token", redirectUrl: "" },
      orderId: "DON-2",
      snapReady: false,
    }),
    { kind: "none" },
  );
  assert.deepEqual(
    chooseDonationHandoff({
      payment: { snapToken: "", redirectUrl: "https://app.midtrans.com/r" },
      orderId: "DON-2",
      snapReady: true,
    }),
    { kind: "redirect", url: "https://app.midtrans.com/r" },
  );
  assert.deepEqual(
    chooseDonationHandoff({ payment: undefined, orderId: "DON-2", snapReady: true }),
    { kind: "none" },
  );
});

test("Snap.js is not mounted until the donor submits", () => {
  const read = (relativePath: string) =>
    readFileSync(path.join(process.cwd(), relativePath), "utf8");

  const page = read("src/app/donasi/page.tsx");
  assert.doesNotMatch(page, /<MidtransSnapScript/);
  assert.match(page, /snapClientKey=\{midtransClientKey\}/);
  assert.match(page, /snapIsProduction=\{midtransIsProduction\}/);

  const form = read("src/app/donasi/donation-form.tsx");
  assert.match(form, /loadSnapScript/);
  assert.match(form, /await snapReadyPromise/);
  assert.match(form, /chooseDonationHandoff/);
});
