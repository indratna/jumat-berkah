import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicHeader } from "@/components/landing/public-header";
import {
  getDistributionReportById,
  getPublishedDistributionStoryNav,
} from "@/lib/distribution-report";

type StoryPageProps = {
  params: Promise<{ id: string }>;
};

function formatStoryDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await getDistributionReportById(id);

  if (!report || !report.publishedAt) {
    return {
      title: "Cerita Penyaluran Tidak Ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const title = `${report.title} | Cerita Penyaluran`;
  const description = report.summary.slice(0, 160);
  const image = report.photoUrls[0] ?? "/images/distribution-default.svg";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const path = `/cerita/${report.id}`;
  const url = appUrl ? `${appUrl}${path}` : path;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      images: [
        {
          url: image,
          alt: `Foto penyaluran ${report.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const report = await getDistributionReportById(id);

  if (!report || !report.publishedAt) {
    notFound();
  }

  const coverImageUrl =
    report.photoUrls[0] ?? "/images/distribution-default.svg";
  const nav = await getPublishedDistributionStoryNav(report.id);

  return (
    <main className="landing-craft landing-noise min-h-screen bg-[color:var(--craft-paper)] text-[color:var(--craft-ink)]">
      <PublicHeader />
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <article className="craft-card overflow-hidden p-6 sm:p-8">
          <Link
            href="/"
            className="text-sm font-semibold text-[color:var(--craft-ink-soft)] underline underline-offset-4 hover:text-[color:var(--craft-leaf)]"
          >
            ← Kembali ke beranda
          </Link>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-cream-strong)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt={`Foto penyaluran ${report.title}`}
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="space-y-3">
              <span className="craft-pill self-start">
                {formatStoryDate(report.cycleStart)}
              </span>
              {report.locationSummary ? (
                <p className="text-sm font-semibold text-[color:var(--craft-ink-soft)]">
                  {report.locationSummary}
                </p>
              ) : null}
              {report.packageCount !== null ? (
                <p className="text-sm font-semibold text-[color:var(--craft-ink-soft)]">
                  {report.packageCount} paket
                </p>
              ) : null}
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                {report.title}
              </h1>
              <Link
                href="/laporan?period=jumat#cerita-penyaluran"
                className="inline-flex text-sm font-semibold text-[color:var(--craft-leaf)] underline underline-offset-4 hover:text-[color:var(--craft-leaf-strong)]"
              >
                Lihat di laporan publik →
              </Link>
            </div>
          </div>

          <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[color:var(--craft-ink-soft)]">
            {report.summary}
          </p>

          {report.photoUrls.length > 1 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.photoUrls.slice(1).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-2xl border border-[color:var(--craft-line)] bg-[color:var(--craft-cream-strong)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Foto kegiatan penyaluran"
                    className="aspect-[16/10] w-full object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          ) : null}

          {nav.previous || nav.next ? (
            <nav className="mt-8 grid gap-3 border-t border-[color:var(--craft-line)] pt-6 sm:grid-cols-2">
              {nav.previous ? (
                <Link
                  href={`/cerita/${nav.previous.id}`}
                  className="rounded-xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper-soft)] px-4 py-3 text-sm hover:border-[color:var(--craft-leaf)]"
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--craft-ink-soft)]">
                    Cerita Sebelumnya
                  </span>
                  <span className="mt-1 block font-semibold text-[color:var(--craft-ink)]">
                    {nav.previous.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {nav.next ? (
                <Link
                  href={`/cerita/${nav.next.id}`}
                  className="rounded-xl border border-[color:var(--craft-line)] bg-[color:var(--craft-paper-soft)] px-4 py-3 text-sm hover:border-[color:var(--craft-leaf)] sm:text-right"
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--craft-ink-soft)]">
                    Cerita Berikutnya
                  </span>
                  <span className="mt-1 block font-semibold text-[color:var(--craft-ink)]">
                    {nav.next.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          ) : null}
        </article>
      </div>
    </main>
  );
}
