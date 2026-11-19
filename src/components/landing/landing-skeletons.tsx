export function TargetCardSkeleton() {
  return (
    <section
      className="craft-card-strong flex h-full min-h-[26rem] flex-col justify-between gap-6 p-6 sm:p-8"
      aria-busy="true"
    >
      <div>
        <span className="sr-only">Memuat target minggu ini…</span>
        <div
          aria-hidden="true"
          className="h-6 w-32 animate-pulse rounded-full bg-[color:var(--craft-line)] motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="mt-5 h-8 w-full max-w-xs animate-pulse rounded-xl bg-[color:var(--craft-line)] motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="mt-3 h-4 w-full max-w-sm animate-pulse rounded-lg bg-[color:var(--craft-line)] motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-2xl bg-[color:var(--craft-line)] motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded-lg bg-[color:var(--craft-line)] motion-reduce:animate-none" />
        <div className="h-3 w-full animate-pulse rounded-full bg-[color:var(--craft-line)] motion-reduce:animate-none" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 animate-pulse rounded-2xl bg-[color:var(--craft-line)] motion-reduce:animate-none" />
          <div className="h-16 animate-pulse rounded-2xl bg-[color:var(--craft-line)] motion-reduce:animate-none" />
        </div>
      </div>
    </section>
  );
}

export function StoriesSkeleton() {
  return (
    <section className="space-y-6" aria-busy="true">
      <div>
        <span className="sr-only">Memuat cerita penyaluran…</span>
        <div
          aria-hidden="true"
          className="h-6 w-36 animate-pulse rounded-full bg-[color:var(--craft-line)] motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="mt-4 h-8 w-full max-w-md animate-pulse rounded-xl bg-[color:var(--craft-line)] motion-reduce:animate-none"
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div
          aria-hidden="true"
          className="craft-card h-72 animate-pulse lg:col-span-2 lg:row-span-2 motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="craft-card hidden h-36 animate-pulse lg:block motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="craft-card hidden h-36 animate-pulse lg:block motion-reduce:animate-none"
        />
      </div>
    </section>
  );
}

export function SocialProofSkeleton() {
  return (
    <section className="space-y-4" aria-busy="true">
      <span className="sr-only">Memuat ringkasan donasi…</span>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="craft-card h-28 animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="craft-card h-40 animate-pulse motion-reduce:animate-none"
      />
    </section>
  );
}