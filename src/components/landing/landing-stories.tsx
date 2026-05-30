import Link from "next/link";

import type { LandingStory } from "@/lib/landing";

function formatStoryDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function LandingStories({ stories }: { stories: LandingStory[] }) {
  if (stories.length === 0) {
    return (
      <section id="cerita" className="craft-card p-8 text-center">
        <span className="craft-pill mx-auto">Cerita Penyaluran</span>
        <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
          Cerita pertama akan terbit setelah penyaluran berikutnya.
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
          Admin akan memublikasikan ringkasan penyaluran tiap siklus Jumat.
        </p>
      </section>
    );
  }

  const [main, ...rest] = stories;
  const sideStories = rest.slice(0, 2);

  return (
    <section id="cerita" className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <span className="craft-pill">Cerita Penyaluran</span>
          <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            Dari donasi sampai meja masjid setiap Jumat.
          </h2>
        </div>
        <Link
          href="/laporan?period=jumat"
          className="text-sm font-bold underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:decoration-[color:var(--craft-leaf)]"
        >
          Lihat semua cerita →
        </Link>
      </header>
      <div className="grid gap-5 lg:grid-cols-3 lg:grid-rows-2">
        <FeaturedStory story={main} />
        {sideStories.map((story) => (
          <SecondaryStory key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

function FeaturedStory({ story }: { story: LandingStory }) {
  return (
    <article className="craft-card flex flex-col overflow-hidden lg:col-span-2 lg:row-span-2">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--craft-cream-strong)]">
        {story.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImageUrl}
            alt={`Foto penyaluran ${story.title}`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-xs font-semibold tracking-widest uppercase text-[color:var(--craft-ink-soft)]">
            Foto belum tersedia
          </div>
        )}
        <span className="absolute left-4 top-4 craft-pill bg-[color:var(--craft-paper)]/90">
          {formatStoryDate(story.cycleStart)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-2xl font-bold leading-tight sm:text-[1.7rem]">
          {story.title}
        </h3>
        <p className="text-sm leading-7 text-[color:var(--craft-ink-soft)]">
          {story.summary}
        </p>
        <Link
          href="/laporan?period=jumat"
          className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf-strong)]"
        >
          Baca cerita lengkap →
        </Link>
      </div>
    </article>
  );
}

function SecondaryStory({ story }: { story: LandingStory }) {
  return (
    <article className="craft-card flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[color:var(--craft-cream-strong)]">
        {story.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.coverImageUrl}
            alt={`Foto penyaluran ${story.title}`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-xs font-semibold tracking-widest uppercase text-[color:var(--craft-ink-soft)]">
            Foto belum tersedia
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="craft-pill self-start">
          {formatStoryDate(story.cycleStart)}
        </span>
        <h3 className="text-base font-bold leading-snug">{story.title}</h3>
        <p className="text-sm leading-6 text-[color:var(--craft-ink-soft)] line-clamp-3">
          {story.summary}
        </p>
      </div>
    </article>
  );
}
