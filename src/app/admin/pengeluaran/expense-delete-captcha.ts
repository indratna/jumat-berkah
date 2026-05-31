export type ExpenseDeleteCaptchaChallenge = {
  left: number;
  right: number;
  expected: number;
};

export function generateExpenseDeleteCaptcha(): ExpenseDeleteCaptchaChallenge {
  const left = randomDigit();
  const right = randomDigit();
  return { left, right, expected: left + right };
}

export function isExpenseDeleteCaptchaCorrect(input: {
  expected: number;
  answer: string;
}): boolean {
  const trimmed = input.answer.trim();

  if (trimmed.length === 0) return false;
  if (!/^-?\d+$/.test(trimmed)) return false;

  return Number(trimmed) === input.expected;
}

function randomDigit() {
  return Math.floor(Math.random() * 9) + 1;
}
