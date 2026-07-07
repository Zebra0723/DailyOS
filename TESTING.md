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
- Codes on `/subscriptions`: `HOMEOSVIP25` = Pro **+ admin/testing** (the only admin code —
  unlocks the `/admin` console and the admin referral-testing controls). `ARLEOPRO` = lifetime
  Pro **only, no admin**. `ARLEOPLUS` = Plus. `ARLEOFREE` = reset to Free (also revokes admin).

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
