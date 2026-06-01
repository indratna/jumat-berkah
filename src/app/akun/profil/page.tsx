import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAccountProfile } from "@/lib/account-profile";
import { getProfileInitials } from "@/lib/profile";
import { PasswordChangeForm } from "./password-change-form";
import { ProfileForm } from "./profile-form";

export default async function AccountProfilePage() {
  const user = await getCurrentAccountProfile();

  if (!user) {
    redirect("/masuk");
  }

  const dashboardHref = user.role === "admin" ? "/admin" : "/akun/donasi";
  const roleLabel = user.role === "admin" ? "Admin" : "Donatur";

  return (
    <main className="landing-craft landing-noise min-h-screen text-[color:var(--craft-ink)]">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-base font-extrabold tracking-tight text-[color:var(--craft-ink)]"
          >
            <span className="grid size-10 place-items-center overflow-hidden rounded-2xl ring-1 ring-[color:var(--craft-line-strong)]/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/logo-mark.png"
                alt="Logo Jumat Berkah"
                className="size-full object-cover"
              />
            </span>
            <span>Jumat Berkah Karyo</span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href={dashboardHref}
              className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
            >
              Kembali ke Dashboard
            </Link>
            <Link
              href="/donasi"
              className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
            >
              Donasi Lagi
            </Link>
          </div>
        </header>

        <section className="craft-card-strong p-6 sm:p-8">
          <span className="craft-pill">Profil donatur</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Assalamu’alaikum, {user.name ?? user.email}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)]">
            Kelola identitas akun Anda dengan aman agar pengalaman donasi tetap
            rapi dan nyaman.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <AccountSummaryCard user={user} roleLabel={roleLabel} />
          <div className="space-y-6">
            <EditProfileCard initialName={user.name ?? ""} />
            <SecurityCard />
          </div>
        </section>
      </section>
    </main>
  );
}

function AccountSummaryCard({
  user,
  roleLabel,
}: {
  user: Awaited<ReturnType<typeof getCurrentAccountProfile>>;
  roleLabel: string;
}) {
  if (!user) {
    return null;
  }

  return (
    <article className="craft-card p-6 sm:p-7">
      <span className="craft-pill">Ringkasan akun</span>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid size-24 place-items-center overflow-hidden rounded-[1.75rem] bg-[color:var(--craft-paper)] text-3xl font-extrabold text-[color:var(--craft-leaf)] ring-1 ring-[color:var(--craft-line)]">
          {user.image ? (
            <Image
              src={user.image}
              alt="Foto profil"
              width={96}
              height={96}
              className="size-24 object-cover"
            />
          ) : (
            getProfileInitials(user.name ?? user.email)
          )}
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[color:var(--craft-ink)]">
            {user.name ?? user.email}
          </h2>
          <p className="mt-2 break-all text-sm leading-6 text-[color:var(--craft-ink-soft)]">
            {user.email}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-[color:var(--craft-paper)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--craft-leaf)] ring-1 ring-[color:var(--craft-line)]">
            {roleLabel}
          </p>
        </div>
      </div>
    </article>
  );
}

function EditProfileCard({ initialName }: { initialName: string }) {
  return (
    <article className="craft-card p-6 sm:p-7">
      <span className="craft-pill">Edit profil</span>
      <h2 className="mt-4 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Perbarui nama tampilan
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Gunakan nama yang ingin muncul sebagai identitas akun donatur Anda.
      </p>
      <div className="mt-6">
        <ProfileForm initialName={initialName} />
      </div>
    </article>
  );
}

function SecurityCard() {
  return (
    <article className="craft-card p-6 sm:p-7">
      <span className="craft-pill">Keamanan akun</span>
      <h2 className="mt-4 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Ubah password
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Setelah password berhasil diubah, sesi lain akan dicabut agar akun tetap
        aman.
      </p>
      <div className="mt-6">
        <PasswordChangeForm />
      </div>
    </article>
  );
}
