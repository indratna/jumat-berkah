import Link from "next/link";

import type { LandingStory } from "@/lib/landing";

function formatStoryDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatPortionCount(count: number | null) {
  if (!count || count <= 0) {
    return null;
  }

  return `${new Intl.NumberFormat("id-ID").format(count)} porsi`;
}

export function LandingStories({ stories }: { stories: LandingStory[] }) {
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
          className="inline-flex min-h-11 items-center text-sm font-bold underline decoration-[color:var(--craft-amber)] decoration-2 underline-offset-4 hover:decoration-[color:var(--craft-leaf)]"
        >
          Lihat semua di laporan →
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

function StoryMeta({ story }: { story: LandingStory }) {
  const portions = formatPortionCount(story.packageCount);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--craft-ink-soft)]">
      {portions ? (
        <span className="rounded-full bg-[color:var(--craft-amber)]/20 px-2.5 py-1 text-[color:var(--craft-ink)]">
          {portions}
        </span>
      ) : null}
      {story.locationSummary ? (
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden>📍</span>
          {story.locationSummary}
        </span>
      ) : null}
    </div>
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
            decoding="async"
            width={640}
            height={400}
            className="size-full object-cover"
          />
          <span className="absolute left-4 top-4 craft-pill bg-[color:var(--craft-paper)]/90">
            {formatStoryDate(story.cycleStart)}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <StoryMeta story={story} />
          <h3 className="text-2xl font-bold leading-tight sm:text-[1.7rem]">
            {story.title}
          </h3>
          <p className="text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            {story.summary}
          </p>
          <Link
            href={`/cerita/${story.id}`}
            className="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf-strong)]"
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
          decoding="async"
          width={480}
          height={270}
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="craft-pill self-start">
          {formatStoryDate(story.cycleStart)}
        </span>
        <h3 className="text-base font-bold leading-snug">
          <Link
            href={`/cerita/${story.id}`}
            className="hover:text-[color:var(--craft-leaf)]"
          >
            {story.title}
          </Link>
        </h3>
        <StoryMeta story={story} />
        <p className="text-sm leading-6 text-[color:var(--craft-ink-soft)] line-clamp-3">
          {story.summary}
        </p>
      </div>
    </article>
  );
}