export const publicNavLinks = [
  { href: "/laporan", label: "Laporan" },
  { href: "/tentang", label: "Tentang" },
] as const;

export const publicNavCta = {
  href: "/donasi",
  label: "Donasi Sekarang",
} as const;

export function getPublicNavActiveState(pathname: string) {
  const activeNavHref =
    publicNavLinks.find((link) => link.href === pathname)?.href ?? null;

  return {
    activeNavHref,
    isDonationActive: pathname === publicNavCta.href,
  };
}
