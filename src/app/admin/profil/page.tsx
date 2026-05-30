import Image from "next/image";
import { redirect } from "next/navigation";

import { PasswordChangeForm } from "@/app/akun/profil/password-change-form";
import { ProfileForm } from "@/app/akun/profil/profile-form";
import { getCurrentAccountProfile } from "@/lib/account-profile";
import { getProfileInitials } from "@/lib/profile";

export default async function AdminProfilePage() {
  const user = await getCurrentAccountProfile();

  if (!user) {
    redirect("/login?next=/admin/profil");
  }

  if (user.role !== "admin") {
    redirect("/akun/profil");
  }

  return (
    <main id="main-content" className="mx-auto max-w-295 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 border-b border-slate-200 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-2xl font-extrabold text-green-700 shadow-sm">
              {user.image ? (
                <Image
                  src={user.image}
                  alt="Foto profil"
                  width={80}
                  height={80}
                  className="size-20 object-cover"
                />
              ) : (
                getProfileInitials(user.name ?? user.email)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
                Profil Admin
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Kelola identitas akun
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Perbarui nama tampilan dan jaga keamanan akses admin dari satu
                halaman yang ringkas.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-72">
            <SummaryChip label="Peran" value="Admin" />
            <SummaryChip label="Email" value={user.email} breakAll />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-bold text-slate-950">Ringkasan akun</p>
            <p className="mt-1 text-xs text-slate-500">
              Detail identitas utama untuk akun admin yang sedang aktif.
            </p>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <SummaryRow label="Nama tampilan" value={user.name ?? "-"} />
              <SummaryRow label="Email" value={user.email} breakAll />
              <SummaryRow label="Peran" value="Admin" />
            </div>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-bold text-slate-950">Edit profil</p>
              <p className="mt-1 text-xs text-slate-500">
                Ubah nama tampilan tanpa mengubah email login admin.
              </p>
            </div>
            <div className="px-5 py-5">
              <ProfileForm initialName={user.name ?? ""} />
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-bold text-slate-950">Keamanan akun</p>
              <p className="mt-1 text-xs text-slate-500">
                Ubah password akun email/password. Setelah berhasil, sesi lain
                akan dicabut.
              </p>
            </div>
            <div className="px-5 py-5">
              <PasswordChangeForm />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function SummaryChip({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold text-slate-950 ${breakAll ? "break-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 font-semibold text-slate-950 ${breakAll ? "break-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
