import Link from "next/link";

export type AdminTopTab = {
  href: string;
  label: string;
  active: boolean;
};

export function AdminTopTabs({ tabs }: { tabs: AdminTopTab[] }) {
  return (
    <nav aria-label="Filter cepat" className="flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          scroll={false}
          className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            tab.active
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
