export default function LaporanLoading() {
  return (
    <main className="page-shell text-slate-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="h-4 w-40 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-6 h-10 w-full max-w-2xl animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="h-4 w-24 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-4 h-8 w-32 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="h-6 w-52 animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-slate-50"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
