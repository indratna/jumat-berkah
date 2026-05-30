import assert from "node:assert/strict";
import test from "node:test";

import { resolveDonorAuthBannerVariant } from "@/app/donasi/donor-auth-banner-rules";

const user = { id: "user-1", name: "Aditya", email: "aditya@example.com" };

test("anonymous donor sees auth choices", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: null, donorUser: null }),
    "anonymous",
  );
});

test("donor sees logged in banner", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: null, donorUser: user }),
    "logged-in",
  );
});

test("admin hides donor banner", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: user, donorUser: null }),
    "hidden",
  );
});

test("admin wins when admin and donor are both present", () => {
  assert.equal(
    resolveDonorAuthBannerVariant({ adminUser: user, donorUser: user }),
    "hidden",
  );
});
