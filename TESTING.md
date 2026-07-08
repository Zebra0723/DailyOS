# Testing protocol

When Arjun says **"test"**, output a black-box test checklist covering **only what has been
added or changed since the baseline below** — not the whole app.

Rules for that output:
- One check per line, in a single copy-paste code block.
- No headings or extra prose inside the box.
- Each line stands alone and carries its own URL/path (the tester only sees the live
  website — it has no access to this repo).
- Website-observable only (visible text, elements, behaviour).
- Exclude anything owner/admin-only (the `/admin` console, "Owner? Unlock…" links, the
  admin promo code, HomeOS "Load/Reset demo data" buttons).
- Promo/admin codes are private (validated server-side against env vars, known only to
  Arjun & Leo) — they are deliberately not written down here. A tester can't reach paid or
  admin features by code; if a test needs a paid tier, Arjun supplies a code out of band.

After delivering a "test" checklist, advance the baseline below to the current version/commit
so the next "test" only covers what came after it.

To compute the delta: `git log <last baseline commit>..HEAD` and the version bumps in
`src/lib/version.ts`.

---

## Current baseline

- **Version:** v112 (Remember me + session expiry)
- **Commit:** d1dbaf2
- **Date:** 2026-07-05
- **Note:** The full-app checklist delivered on 2026-07-05 covered everything through v112,
  so the next "test" starts from here.
