import { ExpenseApprovalStatus, Prisma } from "@/generated/prisma/client";

export type ExpenseApprovalDecision = {
  status: ExpenseApprovalStatus;
  approvalRequired: number;
  approvedAt: Date | null;
};

export type ApprovalProgress = {
  approved: boolean;
  approvalCount: number;
  approvalRequired: number;
};

export function getExpenseApprovalThreshold(): number | null {
  const value = process.env.EXPENSE_APPROVAL_THRESHOLD_RUPIAH;

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getExpenseApprovalRequiredCount(): number {
  const value = process.env.EXPENSE_APPROVAL_REQUIRED_COUNT;
  const parsed = typeof value === "string" ? Number(value.trim()) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 2;
}

export function decideExpenseApproval(input: {
  amount: number;
  threshold: number | null;
  requiredCount: number;
  now: Date;
}): ExpenseApprovalDecision {
  if (input.threshold !== null && input.amount >= input.threshold) {
    return {
      status: ExpenseApprovalStatus.pending_approval,
      approvalRequired: Math.max(input.requiredCount, 1),
      approvedAt: null,
    };
  }

  return {
    status: ExpenseApprovalStatus.approved,
    approvalRequired: 1,
    approvedAt: input.now,
  };
}

export function evaluateApprovalProgress(input: {
  approvalCount: number;
  approvalRequired: number;
}): ApprovalProgress {
  return {
    approvalCount: input.approvalCount,
    approvalRequired: input.approvalRequired,
    approved: input.approvalCount >= input.approvalRequired,
  };
}

export function expenseApprovalAuditAfter(input: {
  channel: "telegram";
  telegramChatId: number;
  telegramUserId: number;
  approvalCount: number;
  approvalRequired: number;
  approved: boolean;
}): Prisma.InputJsonValue {
  return {
    channel: input.channel,
    telegramChatId: input.telegramChatId,
    telegramUserId: input.telegramUserId,
    approvalCount: input.approvalCount,
    approvalRequired: input.approvalRequired,
    approved: input.approved,
  };
}
