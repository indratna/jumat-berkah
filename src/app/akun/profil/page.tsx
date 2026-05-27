import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAccountProfile } from "@/lib/account-profile";
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
    <main className="min-h-screen bg-emerald-50 px-6 py-16 text-emerald-950">
      <section className="mx-auto max-w-3xl space-y-6">
        <Link
          href={dashboardHref}
          className="inline-flex text-sm font-semibold text-emerald-800 hover:text-emerald-950"
        >
          ← Kembali
        </Link>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-20 place-items-center overflow-hidden rounded-3xl bg-emerald-100 text-2xl font-black text-emerald-800">
              {user.image ? (
                <Image
                  src={user.image}
                  alt="Foto profil"
                  width={80}
                  height={80}
                  className="size-20 object-cover"
                />
              ) : (
                getInitials(user.name ?? user.email)
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Profil Akun
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                Kelola identitas akun.
              </h1>
              <p className="mt-2 text-sm text-emerald-900/70">
                {roleLabel} · {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-emerald-100">
          <h2 className="text-xl font-bold">Data profil</h2>
          <div className="mt-5 grid gap-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900/75">
            <div>
              <p className="font-semibold text-emerald-950">Email</p>
              <p className="mt-1">{user.email}</p>
            </div>
            <div>
              <p className="font-semibold text-emerald-950">Peran</p>
              <p className="mt-1">{roleLabel}</p>
            </div>
          </div>
          <div className="mt-6">
            <ProfileForm initialName={user.name ?? ""} />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-950">Keamanan akun</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ubah password hanya untuk akun email/password. Setelah berhasil,
            sesi lain akan dicabut.
          </p>
          <div className="mt-6">
            <PasswordChangeForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function getInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "JB";
}
