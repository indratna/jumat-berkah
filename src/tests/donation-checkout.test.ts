import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDonationStatusUrl,
  canUseSnapPopup,
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
