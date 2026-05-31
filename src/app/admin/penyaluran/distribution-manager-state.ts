export type DistributionModalType = "add" | "edit" | "delete";

export type DistributionModalState =
  | { type: "add" }
  | { type: "edit"; reportId: string }
  | { type: "delete"; reportId: string }
  | null;

export function resolveDistributionModalState(input: {
  modal: string | null;
  editReportId: string | null;
  deleteReportId: string | null;
}): DistributionModalState {
  if (input.deleteReportId && input.deleteReportId.trim().length > 0) {
    return { type: "delete", reportId: input.deleteReportId };
  }

  if (input.editReportId && input.editReportId.trim().length > 0) {
    return { type: "edit", reportId: input.editReportId };
  }

  if (input.modal === "add") {
    return { type: "add" };
  }

  return null;
}

export function buildDistributionModalQuery(input: {
  query: URLSearchParams;
  modal: DistributionModalType;
  reportId?: string;
}) {
  const next = new URLSearchParams(input.query);
  next.delete("page");
  next.delete("modal");
  next.delete("editReportId");
  next.delete("deleteReportId");

  if (input.modal === "edit" && input.reportId) {
    next.set("editReportId", input.reportId);
    return next.toString();
  }

  if (input.modal === "delete" && input.reportId) {
    next.set("deleteReportId", input.reportId);
    return next.toString();
  }

  if (input.modal === "add") {
    next.set("modal", "add");
  }

  return next.toString();
}

export function buildDistributionBaseQuery(query: URLSearchParams) {
  const next = new URLSearchParams(query);
  next.delete("modal");
  next.delete("editReportId");
  next.delete("deleteReportId");
  return next.toString();
}
