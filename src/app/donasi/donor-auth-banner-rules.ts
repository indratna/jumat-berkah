export type DonorAuthBannerUser = {
  id: string;
  name: string | null;
  email: string;
};

export type DonorAuthBannerVariant = "anonymous" | "logged-in" | "hidden";

export function resolveDonorAuthBannerVariant(input: {
  adminUser: DonorAuthBannerUser | null;
  donorUser: DonorAuthBannerUser | null;
}): DonorAuthBannerVariant {
  if (input.adminUser) {
    return "hidden";
  }

  if (input.donorUser) {
    return "logged-in";
  }

  return "anonymous";
}
