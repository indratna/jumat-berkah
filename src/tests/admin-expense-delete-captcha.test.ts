import assert from "node:assert/strict";
import test from "node:test";

import {
  generateExpenseDeleteCaptcha,
  isExpenseDeleteCaptchaCorrect,
} from "@/app/admin/pengeluaran/expense-delete-captcha";

test("generateExpenseDeleteCaptcha returns single-digit numbers and matching expected sum", () => {
  for (let i = 0; i < 50; i += 1) {
    const challenge = generateExpenseDeleteCaptcha();
    assert.ok(challenge.left >= 1 && challenge.left <= 9);
    assert.ok(challenge.right >= 1 && challenge.right <= 9);
    assert.equal(challenge.expected, challenge.left + challenge.right);
  }
});

test("isExpenseDeleteCaptchaCorrect accepts trimmed numeric answer", () => {
  assert.equal(
    isExpenseDeleteCaptchaCorrect({ expected: 7, answer: "  7 " }),
    true,
  );
});

test("isExpenseDeleteCaptchaCorrect rejects empty or wrong answer", () => {
  assert.equal(isExpenseDeleteCaptchaCorrect({ expected: 7, answer: "" }), false);
  assert.equal(
    isExpenseDeleteCaptchaCorrect({ expected: 7, answer: "abc" }),
    false,
  );
  assert.equal(isExpenseDeleteCaptchaCorrect({ expected: 7, answer: "8" }), false);
});
