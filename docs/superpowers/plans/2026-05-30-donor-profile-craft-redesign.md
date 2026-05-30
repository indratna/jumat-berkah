# Donor Profile Craft Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/akun/profil` so it visually matches the donor craft experience while preserving existing profile update and password change behavior.

**Architecture:** Keep all existing auth, profile update, and password change logic untouched. Recompose the server page into a craft shell with a personal hero and three clear account blocks, then lightly restyle existing client forms to match the new donor dashboard language without changing their API behavior.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind craft utilities, Better Auth, node:test, existing profile/password APIs.

---

## File Structure

### Files to modify

- `src/app/akun/profil/page.tsx` — replace old `page-shell` profile page with donor craft shell, personal hero, and 3-block layout.
- `src/app/akun/profil/profile-form.tsx` — restyle name update form to match craft cards and copy.
- `src/app/akun/profil/password-change-form.tsx` — restyle password form to match craft cards and copy.
- `IMPLEMENTATION_PLAN.md` — add Work Log entry after implementation and validation.

### Existing code to preserve

- `src/lib/account-profile.ts` — current donor/admin account resolver.
- `/api/account/profile` — keep update behavior unchanged.
- `/api/account/password` — keep password update behavior unchanged.

---

## Task 1: Craft profile page shell

**Files:**
- Modify: `src/app/akun/profil/page.tsx`

- [ ] **Step 1: Replace old `page-shell` wrapper with craft shell**

Change the page wrapper to:

```tsx
  return (
    <main className="landing-craft landing-noise min-h-screen text-[color:var(--craft-ink)]">
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* craft header, hero, and 3 blocks */}
      </section>
    </main>
  );
```

- [ ] **Step 2: Add craft header with donor navigation**

Replace the old back-link with:

```tsx
<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <Link
    href="/"
    className="inline-flex items-center gap-3 text-base font-extrabold tracking-tight text-[color:var(--craft-ink)]"
  >
    <span className="grid size-10 place-items-center rounded-2xl bg-[color:var(--craft-leaf)] text-sm font-bold text-[color:var(--craft-cream)]">
      JB
    </span>
    <span>Jumat Berkah Karyo</span>
  </Link>
  <div className="flex flex-wrap gap-2">
    <Link
      href={dashboardHref}
      className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--craft-line-strong)] px-5 text-sm font-bold text-[color:var(--craft-ink)] hover:border-[color:var(--craft-leaf)] hover:text-[color:var(--craft-leaf)]"
    >
      Kembali ke Dashboard
    </Link>
    <Link
      href="/donasi"
      className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--craft-leaf)] px-5 text-sm font-bold text-[color:var(--craft-cream)] hover:bg-[color:var(--craft-leaf-strong)]"
    >
      Donasi Lagi
    </Link>
  </div>
</header>
```

- [ ] **Step 3: Add personal hero card**

Insert hero block:

```tsx
<section className="craft-card-strong p-6 sm:p-8">
  <span className="craft-pill">Profil donatur</span>
  <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
    Assalamu’alaikum, {user.name ?? user.email}
  </h1>
  <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--craft-ink-soft)]">
    Kelola identitas akun Anda dengan aman agar pengalaman donasi tetap rapi dan nyaman.
  </p>
</section>
```

- [ ] **Step 4: Replace old summary panel with 3-block layout shell**

Use:

```tsx
<section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
  <AccountSummaryCard user={user} roleLabel={roleLabel} />
  <div className="space-y-6">
    <EditProfileCard initialName={user.name ?? ""} />
    <SecurityCard />
  </div>
</section>
```

- [ ] **Step 5: Add `AccountSummaryCard` helper in same file**

Add below page component:

```tsx
function AccountSummaryCard({
  user,
  roleLabel,
}: {
  user: Awaited<ReturnType<typeof getCurrentAccountProfile>>;
  roleLabel: string;
}) {
  if (!user) {
    return null;
  }

  return (
    <article className="craft-card p-6 sm:p-7">
      <span className="craft-pill">Ringkasan akun</span>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid size-24 place-items-center overflow-hidden rounded-[1.75rem] bg-[color:var(--craft-paper)] text-3xl font-extrabold text-[color:var(--craft-leaf)] ring-1 ring-[color:var(--craft-line)]">
          {user.image ? (
            <Image
              src={user.image}
              alt="Foto profil"
              width={96}
              height={96}
              className="size-24 object-cover"
            />
          ) : (
            getInitials(user.name ?? user.email)
          )}
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[color:var(--craft-ink)]">
            {user.name ?? user.email}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)] break-all">
            {user.email}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-[color:var(--craft-paper)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--craft-leaf)] ring-1 ring-[color:var(--craft-line)]">
            {roleLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 6: Add `EditProfileCard` helper in same file**

```tsx
function EditProfileCard({ initialName }: { initialName: string }) {
  return (
    <article className="craft-card p-6 sm:p-7">
      <span className="craft-pill">Edit profil</span>
      <h2 className="mt-4 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Perbarui nama tampilan
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Gunakan nama yang ingin muncul sebagai identitas akun donatur Anda.
      </p>
      <div className="mt-6">
        <ProfileForm initialName={initialName} />
      </div>
    </article>
  );
}
```

- [ ] **Step 7: Add `SecurityCard` helper in same file**

```tsx
function SecurityCard() {
  return (
    <article className="craft-card p-6 sm:p-7">
      <span className="craft-pill">Keamanan akun</span>
      <h2 className="mt-4 text-2xl font-extrabold text-[color:var(--craft-ink)]">
        Ubah password
      </h2>
      <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
        Setelah password berhasil diubah, sesi lain akan dicabut agar akun tetap aman.
      </p>
      <div className="mt-6">
        <PasswordChangeForm />
      </div>
    </article>
  );
}
```

- [ ] **Step 8: Run build to verify type safety**

Run:

```bash
npm run build
```

Expected: PASS. Known warning: local low-entropy `BETTER_AUTH_SECRET` may appear.

- [ ] **Step 9: Commit**

```bash
git add src/app/akun/profil/page.tsx
git commit -m "Redesign donor profile page shell"
```

---

## Task 2: Restyle profile form to craft language

**Files:**
- Modify: `src/app/akun/profil/profile-form.tsx`

- [ ] **Step 1: Keep logic, replace generic form styling**

Update return markup to preserve the same fetch/refresh logic but use craft-friendly classes:

```tsx
return (
  <form onSubmit={handleSubmit} className="space-y-5">
    <div>
      <label
        htmlFor="name"
        className="text-sm font-semibold text-[color:var(--craft-ink)]"
      >
        Nama tampilan
      </label>
      <input
        id="name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={100}
        className="field mt-2 text-sm"
        placeholder="Nama tampilan"
      />
      <p className="mt-2 text-xs leading-6 text-[color:var(--craft-ink-soft)]">
        Email tidak dapat diubah dari halaman ini agar akses akun tetap aman.
      </p>
    </div>

    {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
    {status === "success" ? (
      <p className="text-sm font-semibold text-[color:var(--craft-leaf)]">
        Profil berhasil diperbarui.
      </p>
    ) : null}

    <button
      type="submit"
      disabled={status === "saving"}
      className="btn-primary text-sm disabled:opacity-60"
    >
      {status === "saving" ? "Menyimpan…" : "Simpan profil"}
    </button>
  </form>
);
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/akun/profil/profile-form.tsx
git commit -m "Restyle donor profile form"
```

---

## Task 3: Restyle password form to craft language

**Files:**
- Modify: `src/app/akun/profil/password-change-form.tsx`

- [ ] **Step 1: Keep logic, replace generic form styling**

Update main form return:

```tsx
return (
  <form onSubmit={handleSubmit} className="space-y-5">
    <PasswordField
      id="current-password"
      label="Password saat ini"
      value={currentPassword}
      onChange={setCurrentPassword}
      error={errors.currentPassword}
    />
    <PasswordField
      id="new-password"
      label="Password baru"
      value={newPassword}
      onChange={setNewPassword}
      error={errors.newPassword}
    />
    <PasswordField
      id="confirm-password"
      label="Konfirmasi password baru"
      value={confirmPassword}
      onChange={setConfirmPassword}
      error={errors.confirmPassword}
    />

    {errors.auth ? (
      <p className="text-sm font-semibold text-rose-700">{errors.auth}</p>
    ) : null}
    {status === "success" ? (
      <p className="text-sm font-semibold text-[color:var(--craft-leaf)]">
        Password berhasil diperbarui. Sesi lain sudah dicabut.
      </p>
    ) : null}

    <button
      type="submit"
      disabled={status === "saving"}
      className="btn-primary text-sm disabled:opacity-60"
    >
      {status === "saving" ? "Menyimpan…" : "Ubah password"}
    </button>
  </form>
);
```

- [ ] **Step 2: Restyle `PasswordField` labels/errors**

Use:

```tsx
function PasswordField(input: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={input.id}
        className="text-sm font-semibold text-[color:var(--craft-ink)]"
      >
        {input.label}
      </label>
      <input
        id={input.id}
        type="password"
        value={input.value}
        onChange={(event) => input.onChange(event.target.value)}
        className="field mt-2 text-sm"
        autoComplete="off"
      />
      {input.error ? (
        <p className="mt-2 text-xs font-semibold text-rose-700">
          {input.error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/akun/profil/password-change-form.tsx
git commit -m "Restyle donor password form"
```

---

## Task 4: Final validation and docs

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Add Work Log entry**

Under `2026-05-30`, add:

```md
- Redesigned donor profile page `/akun/profil` with craft styling to match the donor dashboard and public donor flows. Added craft header, personal hero, account summary card, profile edit card, and security card while preserving existing profile update and password change behavior. Validation passed: `npm run lint`, `npm test`, `npm run build`. Manual smoke covered donor profile render, dashboard/back CTA, donor avatar-or-initials fallback, profile update flow, password form render, and anonymous redirect to `/masuk`.
```

- [ ] **Step 2: Run full validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: all PASS.

- [ ] **Step 3: Manual smoke**

Open local page:

```txt
http://localhost:3037/akun/profil
```

Verify:

- Logged-in donor sees craft header, personal hero, and 3 blocks.
- `Kembali ke Dashboard` goes to `/akun/donasi`.
- `Donasi Lagi` goes to `/donasi`.
- Existing profile image renders if present; otherwise initials fallback looks correct.
- Name update form still works.
- Password form still renders and preserves current behavior.
- Anonymous visitor redirects to `/masuk`.

- [ ] **Step 4: Commit**

```bash
git add IMPLEMENTATION_PLAN.md
git commit -m "Document donor profile redesign"
```

---

## Self-Review

- Spec coverage: craft shell, donor navigation, personal hero, 3 blocks, avatar fallback, profile form, password form, and validation are all covered.
- Placeholder scan: no TBD/TODO or vague placeholders remain.
- Type consistency: `dashboardHref`, `roleLabel`, `ProfileForm`, and `PasswordChangeForm` usage stay aligned with existing code.
- Scope check: no avatar upload, email change, auth flow, schema, or admin redesign work included.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-donor-profile-craft-redesign.md`.

Two execution options:

1. Subagent-Driven (recommended) — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
