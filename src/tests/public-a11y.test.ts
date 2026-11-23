import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PUBLIC_PAGES_WITH_MAIN = [
  "src/app/page.tsx",
  "src/app/donasi/page.tsx",
  "src/app/laporan/page.tsx",
  "src/app/tentang/page.tsx",
  "src/app/masuk/page.tsx",
  "src/app/daftar/page.tsx",
  "src/app/cek-email/page.tsx",
  "src/app/lupa-password/page.tsx",
  "src/app/reset-password/page.tsx",
  "src/app/cerita/[id]/page.tsx",
  "src/app/donasi/status/page.tsx",
  "src/app/donasi/status/[orderId]/page.tsx",
  "src/app/laporan/loading.tsx",
  "src/app/laporan/error.tsx",
];

test("every public main landmark is a skip-link target", () => {
  for (const relativePath of PUBLIC_PAGES_WITH_MAIN) {
    const source = readSource(relativePath);
    assert.match(
      source,
      /id="main-content"/,
      `${relativePath} harus punya id="main-content"`,
    );
  }
});

test("the report loading skeleton announces itself", () => {
  const source = readSource("src/app/laporan/loading.tsx");
  assert.match(source, /aria-busy="true"/);
  assert.match(source, /sr-only">Memuat laporan/);
});

test("the LCP hero image is loaded eagerly with high priority", () => {
  const source = readSource("src/components/landing/landing-hero.tsx");
  assert.match(source, /loading="eager"/);
  assert.match(source, /fetchPriority="high"/);
  assert.doesNotMatch(source, /loading="lazy"/);
});

test("the logo uses the image optimizer instead of the 3000px source", () => {
  for (const relativePath of [
    "src/components/landing/public-header.tsx",
    "src/app/masuk/page.tsx",
    "src/app/daftar/page.tsx",
  ]) {
    const source = readSource(relativePath);
    assert.match(source, /from "next\/image"/, `${relativePath} perlu next/image`);
    assert.match(source, /sizes="40px"/);
    assert.doesNotMatch(
      source,
      /<img[\s\S]*?logo-mark\.png/,
      `${relativePath} masih memakai <img> mentah`,
    );
  }
});

test("Rupiah formatter is created once at module load", () => {
  const source = readSource("src/lib/format.ts");
  const formatterIndex = source.indexOf("new Intl.NumberFormat");
  const functionIndex = source.indexOf("export function formatRupiah");

  assert.ok(formatterIndex >= 0);
  assert.ok(functionIndex > formatterIndex);
  assert.equal(source.match(/new Intl\.NumberFormat/g)?.length, 1);
});

test("donation form errors and result are announced", () => {
  const source = readSource("src/app/donasi/donation-form.tsx");

  for (const id of ["donor-name-error", "donor-email-error", "donor-phone-error"]) {
    assert.match(source, new RegExp(`id="${id}"`));
  }
  assert.match(source, /aria-invalid=\{errors\.donorName/);
  assert.match(source, /aria-invalid=\{errors\.donorEmail/);
  assert.match(source, /aria-invalid=\{errors\.donorPhone/);
  assert.match(source, /role="status"[\s\S]*?aria-live="polite"/);
});

test("public auth forms announce errors and status messages", () => {
  for (const relativePath of [
    "src/app/masuk/donor-login-form.tsx",
    "src/app/daftar/donor-signup-form.tsx",
    "src/app/lupa-password/password-reset-request-form.tsx",
    "src/app/reset-password/reset-password-form.tsx",
    "src/app/reset-password/page.tsx",
    "src/app/donasi/donor-auth-modal-panel.tsx",
  ]) {
    const source = readSource(relativePath);
    assert.match(
      source,
      /role="alert"|role="status"/,
      `${relativePath} perlu live region`,
    );
  }
});

test("disabled public buttons keep readable text", () => {
  for (const relativePath of [
    "src/app/donasi/donation-form.tsx",
    "src/components/landing/hero-amount-picker.tsx",
    "src/app/donasi/donor-auth-modal-panel.tsx",
    "src/app/daftar/donor-signup-form.tsx",
    "src/app/masuk/donor-login-form.tsx",
    "src/app/login/admin-login-form.tsx",
    "src/app/lupa-password/password-reset-request-form.tsx",
    "src/app/reset-password/reset-password-form.tsx",
  ]) {
    const source = readSource(relativePath);
    assert.doesNotMatch(
      source,
      /disabled:bg-slate-300/,
      `${relativePath} masih memakai teks putih di latar disabled`,
    );
  }
});

test("report progress and gallery images have accessible metadata", () => {
  const source = readSource("src/app/laporan/page.tsx");
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-valuenow=/);
  assert.match(source, /Foto kegiatan penyaluran ke-\$\{index \+ 1\}/);
});

test("intentional hard navigations are documented for lint", () => {
  for (const relativePath of [
    "src/app/admin/logout-button.tsx",
    "src/app/akun/donasi/logout-button.tsx",
    "src/app/login/admin-login-form.tsx",
    "src/app/donasi/donor-auth-modal-panel.tsx",
  ]) {
    const source = readSource(relativePath);
    assert.match(
      source,
      /eslint-disable-next-line @next\/next\/no-location-assign-relative-destination/,
      `${relativePath} perlu justifikasi hard navigation`,
    );
  }
});

test("landing uses ISR instead of forcing a dynamic render", () => {
  const source = readSource("src/app/page.tsx");
  assert.match(source, /export const revalidate = 60/);
  assert.doesNotMatch(source, /force-dynamic/);
});

test("the unused display font weight is not preloaded", () => {
  const source = readSource("src/app/layout.tsx");
  assert.doesNotMatch(source, /plus-jakarta-sans-latin-400-normal/);
  assert.equal(source.match(/path: "\.\/fonts\//g)?.length, 7);
});

test("the public header is a server shell with a client navigation island", () => {
  const header = readSource("src/components/landing/public-header.tsx");
  assert.doesNotMatch(header, /"use client"/);
  assert.match(header, /from "next\/image"/);
  assert.match(header, /sizes="40px"/);
  assert.match(header, /<PublicHeaderNav \/>/);

  const nav = readSource("src/components/landing/public-header-nav.tsx");
  assert.match(nav, /"use client"/);
  assert.match(nav, /usePathname\(\)/);
  assert.match(nav, /aria-label="Navigasi utama"/);
});

test("the auth modal panel is lazy-loaded from a client trigger", () => {
  const trigger = readSource("src/app/donasi/donor-auth-modal.tsx");
  assert.match(trigger, /next\/dynamic/);
  assert.match(trigger, /ssr: false/);
  assert.match(trigger, /createPortal/);

  const panel = readSource("src/app/donasi/donor-auth-modal-panel.tsx");
  assert.match(panel, /export function DonorAuthModal/);
  assert.match(panel, /role="dialog"/);
});
