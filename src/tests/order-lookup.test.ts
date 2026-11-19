import assert from "node:assert/strict";
import test from "node:test";

import { extractOrderId } from "@/lib/order-lookup";

test("order lookup accepts a bare order id and normalizes case", () => {
  assert.equal(extractOrderId(" JB-20261119-ABCD1234 "), "JB-20261119-ABCD1234");
  assert.equal(extractOrderId("jb-20261119-abcd1234"), "JB-20261119-ABCD1234");
});

test("order lookup accepts a pasted status url", () => {
  assert.equal(
    extractOrderId("https://berkahkaryo.my.id/donasi/status/JB-20261119-ABCD1234"),
    "JB-20261119-ABCD1234",
  );
  assert.equal(
    extractOrderId("/donasi/status/JB-20261119-ABCD1234?from=wa"),
    "JB-20261119-ABCD1234",
  );
});

test("order lookup rejects empty and unsafe input", () => {
  assert.equal(extractOrderId(""), null);
  assert.equal(extractOrderId("   "), null);
  assert.equal(extractOrderId("ab"), null);
  assert.equal(extractOrderId("JB/2026/1"), null);
  assert.equal(extractOrderId("<script>alert(1)</script>"), null);
});