export type AppUserRole = "admin" | "donor";

export function canGrantAdminAccess(input: {
  sessionEmail: string | null;
  appUserRole: AppUserRole | null;
}) {
  return Boolean(input.sessionEmail && input.appUserRole === "admin");
}

export function canGrantDonorAccess(input: {
  sessionEmail: string | null;
  appUserRole: AppUserRole | null;
}) {
  return Boolean(input.sessionEmail && input.appUserRole === "donor");
}
