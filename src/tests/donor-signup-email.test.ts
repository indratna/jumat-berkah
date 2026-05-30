import assert from "node:assert/strict";
import test from "node:test";

import { buildEmailVerificationEmail } from "@/lib/email";

test("buildEmailVerificationEmail returns Indonesian verification email", () => {
  const email = buildEmailVerificationEmail({
    email: "donor@example.com",
    url: "https://example.com/verify?token=abc",
  });

  assert.deepEqual(email.to, ["donor@example.com"]);
  assert.equal(email.subject, "Verifikasi email donatur Jumat Berkah Karyo");
  assert.match(email.text, /Verifikasi email/);
  assert.match(email.text, /https:\/\/example\.com\/verify\?token=abc/);
  assert.match(email.html ?? "", /Verifikasi email/);
});
