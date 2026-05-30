import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import {
  getSystemSettings,
  type SystemSettingItem,
  type SystemSettingStatus,
} from "@/lib/system-settings";

export default async function SystemSettingsPage() {
  const cookieStore = await cookies();
  const legacySession = verifyAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const betterAuthAdmin = legacySession
    ? null
    : await requireBetterAuthAdminUser(await headers());

  if (!legacySession && !betterAuthAdmin) {
    redirect("/login?next=/admin/pengaturan/sistem");
  }

  const groups = getSystemSettings();

  return (
    <main className="mx-auto max-w-295 space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
          Pengaturan Sistem
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          Status Konfigurasi Server
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Halaman ini menampilkan status pengaturan dari file <code>.env</code>{" "}
          server. Tidak ada nilai rahasia yang dimuat ke browser.
        </p>
      </section>

      {groups.map((group) => (
        <section
          key={group.id}
          className="rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-bold text-slate-950">{group.label}</p>
            <p className="mt-1 text-xs text-slate-500">{group.description}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {group.items.map((item) => (
              <SettingRow key={item.key} item={item} />
            ))}
          </div>
          <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Diatur di file <code>.env</code> server. Hubungi ops untuk
            perubahan.
          </p>
        </section>
      ))}
    </main>
  );
}

function SettingRow({ item }: { item: SystemSettingItem }) {
  return (
    <div className="grid gap-2 px-5 py-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div>
        <p className="text-sm font-bold text-slate-950">{item.label}</p>
        <p className="text-xs text-slate-500">
          <code>{item.key}</code>
        </p>
      </div>
      <StatusBadge status={item.status} />
      <p className="text-sm text-slate-700 sm:text-right">
        {item.detail ?? "—"}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: SystemSettingStatus }) {
  if (status === "ok") {
    return (
      <span className="rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
        Aktif
      </span>
    );
  }

  if (status === "warning") {
    return (
      <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
        Perlu perhatian
      </span>
    );
  }

  return (
    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
      Belum diatur
    </span>
  );
}
