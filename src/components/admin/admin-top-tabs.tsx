import Link from "next/link";

export type AdminTopTab = {
  href: string;
  label: string;
  active: boolean;
};

export function AdminTopTabs({ tabs }: { tabs: AdminTopTab[] }) {
  return (
    <nav
      aria-label="Filter cepat"
      className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          scroll={false}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${
            tab.active
              ? "bg-green-50 text-green-800 ring-1 ring-green-200"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
