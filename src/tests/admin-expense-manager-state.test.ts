import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExpenseBaseQuery,
  buildExpenseModalQuery,
  resolveExpenseModalState,
} from "@/app/admin/pengeluaran/expense-manager-state";

test("resolveExpenseModalState ignores removed import modal", () => {
  assert.equal(
    resolveExpenseModalState({
      modal: "import",
      editExpenseId: null,
      deleteExpenseId: null,
    }),
    null,
  );
});

test("resolveExpenseModalState opens edit when editExpenseId exists", () => {
  assert.deepEqual(
    resolveExpenseModalState({
      modal: null,
      editExpenseId: "exp-99",
      deleteExpenseId: null,
    }),
    { type: "edit", expenseId: "exp-99" },
  );
});

test("resolveExpenseModalState opens delete when deleteExpenseId exists", () => {
  assert.deepEqual(
    resolveExpenseModalState({
      modal: null,
      editExpenseId: null,
      deleteExpenseId: "exp-77",
    }),
    { type: "delete", expenseId: "exp-77" },
  );
});

test("resolveExpenseModalState prioritizes delete modal over edit", () => {
  assert.deepEqual(
    resolveExpenseModalState({
      modal: null,
      editExpenseId: "exp-1",
      deleteExpenseId: "exp-2",
    }),
    { type: "delete", expenseId: "exp-2" },
  );
});

test("resolveExpenseModalState opens add when modal is add and edit/delete absent", () => {
  assert.deepEqual(
    resolveExpenseModalState({
      modal: "add",
      editExpenseId: null,
      deleteExpenseId: null,
    }),
    { type: "add" },
  );
});

test("buildExpenseModalQuery resets page and modal state for add", () => {
  const query = new URLSearchParams(
    "q=beras&page=4&editExpenseId=exp-1&deleteExpenseId=exp-2&from=2026-05-01",
  );

  assert.equal(
    buildExpenseModalQuery({ query, modal: "add" }),
    "q=beras&from=2026-05-01&modal=add",
  );
});

test("buildExpenseModalQuery stores editExpenseId and clears delete/add", () => {
  const query = new URLSearchParams(
    "q=gas&page=2&modal=add&deleteExpenseId=exp-1",
  );

  assert.equal(
    buildExpenseModalQuery({ query, modal: "edit", expenseId: "exp-77" }),
    "q=gas&editExpenseId=exp-77",
  );
});

test("buildExpenseModalQuery stores deleteExpenseId and clears edit/add", () => {
  const query = new URLSearchParams(
    "q=gas&page=2&modal=add&editExpenseId=exp-1",
  );

  assert.equal(
    buildExpenseModalQuery({ query, modal: "delete", expenseId: "exp-99" }),
    "q=gas&deleteExpenseId=exp-99",
  );
});

test("buildExpenseBaseQuery clears modal-only state and keeps filters", () => {
  const query = new URLSearchParams(
    "q=vendor&category=Beras&modal=import&editExpenseId=exp-5&deleteExpenseId=exp-9",
  );

  assert.equal(buildExpenseBaseQuery(query), "q=vendor&category=Beras");
});
