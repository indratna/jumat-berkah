CREATE TYPE "ExpenseApprovalStatus" AS ENUM ('approved', 'pending_approval');

ALTER TABLE "expenses"
  ADD COLUMN "approval_status" "ExpenseApprovalStatus" NOT NULL DEFAULT 'approved',
  ADD COLUMN "approval_required" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "approved_at" TIMESTAMP(3);

UPDATE "expenses"
SET "approved_at" = "created_at"
WHERE "approval_status" = 'approved';

CREATE TABLE "expense_approvals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "expense_id" UUID NOT NULL,
  "telegram_chat_id" BIGINT NOT NULL,
  "telegram_user_id" BIGINT NOT NULL,
  "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "expense_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expense_approvals_expense_id_telegram_user_id_key"
  ON "expense_approvals"("expense_id", "telegram_user_id");

CREATE INDEX "expense_approvals_expense_id_idx"
  ON "expense_approvals"("expense_id");

CREATE INDEX "expenses_approval_status_idx"
  ON "expenses"("approval_status");

ALTER TABLE "expense_approvals"
  ADD CONSTRAINT "expense_approvals_expense_id_fkey"
  FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
