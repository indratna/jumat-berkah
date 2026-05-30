import Image from "next/image";
import { redirect } from "next/navigation";

import { getCurrentAccountProfile } from "@/lib/account-profile";
import { PasswordChangeForm } from "@/app/akun/profil/password-change-form";
import { ProfileForm } from "@/app/akun/profil/profile-form";

export default async function AdminProfilePage() {
  const user = await getCurrentAccountProfile();

  if (!user) {
    redirect("/login?next=/admin/profil");
  }

  if (user.role !== "admin") {
    redirect("/akun/profil");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-20 place-items-center overflow-hidden rounded-xl bg-slate-100 text-2xl font-bold text-green-700">
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
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
              Profil Admin
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Kelola identitas akun
            </h1>
            <p className="mt-1 text-sm text-slate-500">Admin · {user.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <p className="text-sm font-bold text-slate-950">Data profil</p>
          <p className="mt-1 text-xs text-slate-500">
            Nama tampilan dan email akun.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-950">Email</p>
              <p className="mt-1">{user.email}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Peran</p>
              <p className="mt-1">Admin</p>
            </div>
          </div>
          <ProfileForm initialName={user.name ?? ""} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <p className="text-sm font-bold text-slate-950">Keamanan akun</p>
          <p className="mt-1 text-xs text-slate-500">
            Ubah password hanya untuk akun email/password. Setelah berhasil,
            sesi lain dicabut.
          </p>
        </div>
        <div className="px-6 py-5">
          <PasswordChangeForm />
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
