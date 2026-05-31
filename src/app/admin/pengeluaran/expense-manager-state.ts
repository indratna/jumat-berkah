export type ExpenseModalType = "add" | "edit" | "delete";

export type ExpenseModalState =
  | { type: "add" }
  | { type: "edit"; expenseId: string }
  | { type: "delete"; expenseId: string }
  | null;

export function resolveExpenseModalState(input: {
  modal: string | null;
  editExpenseId: string | null;
  deleteExpenseId: string | null;
}): ExpenseModalState {
  if (input.deleteExpenseId && input.deleteExpenseId.trim().length > 0) {
    return { type: "delete", expenseId: input.deleteExpenseId };
  }

  if (input.editExpenseId && input.editExpenseId.trim().length > 0) {
    return { type: "edit", expenseId: input.editExpenseId };
  }

  if (input.modal === "add") {
    return { type: "add" };
  }

  return null;
}

export function buildExpenseModalQuery(input: {
  query: URLSearchParams;
  modal: ExpenseModalType;
  expenseId?: string;
}) {
  const nextQuery = new URLSearchParams(input.query);
  nextQuery.delete("page");
  nextQuery.delete("modal");
  nextQuery.delete("editExpenseId");
  nextQuery.delete("deleteExpenseId");

  if (input.modal === "edit" && input.expenseId) {
    nextQuery.set("editExpenseId", input.expenseId);
    return nextQuery.toString();
  }

  if (input.modal === "delete" && input.expenseId) {
    nextQuery.set("deleteExpenseId", input.expenseId);
    return nextQuery.toString();
  }

  if (input.modal === "add") {
    nextQuery.set("modal", "add");
  }

  return nextQuery.toString();
}

export function buildExpenseBaseQuery(query: URLSearchParams) {
  const nextQuery = new URLSearchParams(query);
  nextQuery.delete("modal");
  nextQuery.delete("editExpenseId");
  nextQuery.delete("deleteExpenseId");
  return nextQuery.toString();
}
