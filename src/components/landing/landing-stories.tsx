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
      <div
        className={
          sideStories.length > 0
            ? "grid gap-5 lg:grid-cols-3 lg:grid-rows-2"
            : "grid gap-5"
        }
      >
        <FeaturedStory story={main} hasSideStories={sideStories.length > 0} />
        {sideStories.map((story) => (
          <SecondaryStory key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

function FeaturedStory({
  story,
  hasSideStories,
}: {
  story: LandingStory;
  hasSideStories: boolean;
}) {
  const coverImageUrl =
    story.coverImageUrl ?? "/images/distribution-default.svg";

  return (
    <article
      className={
        hasSideStories
          ? "craft-card overflow-hidden lg:col-span-2 lg:row-span-2"
          : "craft-card overflow-hidden"
      }
    >
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--craft-cream-strong)] lg:aspect-auto lg:max-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageUrl}
            alt={`Foto penyaluran ${story.title}`}
            loading="lazy"
            className="size-full object-cover"
          />
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
            href={`/cerita/${story.id}`}
            className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf-strong)]"
          >
            Baca cerita lengkap →
          </Link>
        </div>
      </div>
    </article>
  );
}

function SecondaryStory({ story }: { story: LandingStory }) {
  return (
    <article className="craft-card flex flex-col overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[color:var(--craft-cream-strong)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.coverImageUrl ?? "/images/distribution-default.svg"}
          alt={`Foto penyaluran ${story.title}`}
          loading="lazy"
          className="size-full object-cover"
        />
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
