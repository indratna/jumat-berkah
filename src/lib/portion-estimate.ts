export type PortionEstimateInput = {
  amount: number;
  costPerPortion: number | null;
};

/**
 * Cost per portion is derived from real distribution data, never guessed.
 * Returns null when the source data is incomplete or nonsensical.
 */
export function calculateCostPerPortion(
  totalCost: number,
  packageCount: number,
): number | null {
  if (
    !Number.isFinite(totalCost) ||
    !Number.isFinite(packageCount) ||
    totalCost <= 0 ||
    !Number.isInteger(packageCount) ||
    packageCount <= 0
  ) {
    return null;
  }

  const cost = Math.round(totalCost / packageCount);
  return cost > 0 ? cost : null;
}

export function estimatePortionCount({
  amount,
  costPerPortion,
}: PortionEstimateInput): number | null {
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    costPerPortion === null ||
    costPerPortion <= 0
  ) {
    return null;
  }

  return Math.floor(amount / costPerPortion);
}