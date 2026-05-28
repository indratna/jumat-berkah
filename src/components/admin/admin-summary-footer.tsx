export type AdminSummaryItem = {
  label: string;
  value: string;
  helper?: string;
};

export function AdminSummaryFooter({ items }: { items: AdminSummaryItem[] }) {
  return (
    <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 p-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-white p-4">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-500">
            {item.label}
          </p>
          <p className="numeric mt-2 text-lg font-bold text-slate-950">
            {item.value}
          </p>
          {item.helper ? (
            <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
