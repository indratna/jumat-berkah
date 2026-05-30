import Link from "next/link";

import type {
  DonorAuthBannerUser,
  DonorAuthBannerVariant,
} from "./donor-auth-banner-rules";
import { DonorAuthLogoutButton } from "./donor-auth-logout-button";
import { DonorAuthModalTrigger } from "./donor-auth-modal";

export function DonorAuthBanner({
  variant,
  donor,
}: {
  variant: DonorAuthBannerVariant;
  donor: DonorAuthBannerUser | null;
}) {
  if (variant === "hidden") {
    return null;
  }

  if (variant === "logged-in" && donor) {
    return (
      <div className="craft-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--craft-leaf)]">
            Akun donatur aktif
          </p>
          <h2 className="mt-2 text-xl font-extrabold text-[color:var(--craft-ink)]">
            Selamat datang, {donor.name ?? donor.email}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            Donasi ini akan masuk ke riwayat akun Anda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/akun/donasi"
            className="inline-flex min-h-10 items-center rounded-full bg-[color:var(--craft-leaf)] px-4 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
          >
            Lihat riwayat donasi
          </Link>
          <DonorAuthLogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="craft-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--craft-leaf)]">
          Akun donatur
        </p>
        <h2 className="mt-2 text-xl font-extrabold text-[color:var(--craft-ink)]">
          Sudah punya akun?
        </h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          Masuk agar nama dan email tidak perlu diisi ulang.
        </p>
      </div>
      <DonorAuthModalTrigger />
    </div>
  );
}
