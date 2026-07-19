// Builds a polished, self-contained HTML document from a data export — the
// DailyOS look (warm palette, serif headings, clean cards, readable dates)
// instead of a wall of raw JSON. Opens nicely in any browser and prints to PDF.

type Row = Record<string, unknown>;

export type ExportData = {
  exported_at: string;
  account: { id: string; email: string | null };
  tasks: Row[];
  calendar_events: Row[];
  notes: Row[];
  inbox_items: Row[];
  vault_items: Row[];
};

const esc = (v: unknown): string =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

const s = (r: Row, k: string): string => {
  const v = r[k];
  return v == null ? "" : String(v);
};

/** A real timestamp → "4 Jul 2026". */
function fmtDay(v: unknown): string {
  if (!v) return "";
  const raw = String(v);
  const d = new Date(raw.length <= 10 ? `${raw}T00:00:00Z` : raw);
  if (Number.isNaN(d.getTime())) return esc(raw);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** A floating wall-clock event time ("...T14:00:00Z") → "4 Jul 2026, 14:00",
 *  read literally so it never shifts by timezone. */
function fmtFloating(v: unknown): string {
  if (!v) return "";
  const raw = String(v);
  const day = raw.slice(0, 10);
  const time = raw.slice(11, 16);
  const d = new Date(`${day}T00:00:00Z`);
  const dayLabel = Number.isNaN(d.getTime())
    ? day
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  return time ? `${dayLabel}, ${time}` : dayLabel;
}

function pill(text: string): string {
  return `<span class="pill">${esc(text)}</span>`;
}

function card(title: string, meta: string[], body?: string): string {
  const metaLine = meta.filter(Boolean).join(" · ");
  return `<div class="card">
    <div class="card-title">${esc(title) || "Untitled"}</div>
    ${metaLine ? `<div class="card-meta">${metaLine}</div>` : ""}
    ${body ? `<div class="card-body">${body}</div>` : ""}
  </div>`;
}

function section(
  title: string,
  count: number,
  emptyText: string,
  cards: string,
): string {
  return `<section>
    <h2>${esc(title)} <span class="count">${count}</span></h2>
    ${count === 0 ? `<p class="empty">${esc(emptyText)}</p>` : `<div class="cards">${cards}</div>`}
  </section>`;
}

export function buildExportHtml(data: ExportData): string {
  const tasks = data.tasks ?? [];
  const events = data.calendar_events ?? [];
  const notes = data.notes ?? [];
  const inbox = data.inbox_items ?? [];
  const vault = data.vault_items ?? [];

  const exportedOn = fmtDay(data.exported_at);

  const tasksHtml = tasks
    .map((t) =>
      card(s(t, "title"), [
        s(t, "status") ? pill(s(t, "status")) : "",
        s(t, "priority") ? `${esc(s(t, "priority"))} priority` : "",
        s(t, "due_date") ? `due ${fmtDay(s(t, "due_date"))}` : "",
      ], s(t, "description") ? `<p>${esc(s(t, "description"))}</p>` : ""),
    )
    .join("");

  const eventsHtml = events
    .map((e) =>
      card(s(e, "title"), [
        fmtFloating(s(e, "start_time")),
        s(e, "location") ? `📍 ${esc(s(e, "location"))}` : "",
        s(e, "remind_at") ? "🔔 reminder set" : "",
      ], s(e, "description") ? `<p>${esc(s(e, "description"))}</p>` : ""),
    )
    .join("");

  const notesHtml = notes
    .map((n) =>
      card(
        s(n, "category") ? `${s(n, "category")[0].toUpperCase()}${s(n, "category").slice(1)}` : "Note",
        [fmtDay(s(n, "created_at"))],
        s(n, "content") ? `<p>${esc(s(n, "content"))}</p>` : "",
      ),
    )
    .join("");

  const inboxHtml = inbox
    .map((i) =>
      card(s(i, "title"), [
        s(i, "input_type") ? pill(s(i, "input_type")) : "",
        s(i, "status") ? esc(s(i, "status")) : "",
        fmtDay(s(i, "created_at")),
      ], s(i, "summary") ? `<p>${esc(s(i, "summary"))}</p>` : ""),
    )
    .join("");

  const vaultHtml = vault
    .map((v) =>
      card(s(v, "title"), [
        s(v, "category") ? pill(s(v, "category")) : "",
        fmtDay(s(v, "created_at")),
      ], s(v, "summary") ? `<p>${esc(s(v, "summary"))}</p>` : ""),
    )
    .join("");

  const tiles = [
    { n: tasks.length, label: "Tasks" },
    { n: events.length, label: "Events" },
    { n: notes.length, label: "Notes" },
    { n: inbox.length, label: "The Drop" },
    { n: vault.length, label: "Vault" },
  ]
    .map(
      (t) =>
        `<div class="tile"><div class="tile-n">${t.n}</div><div class="tile-l">${t.label}</div></div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>DailyOS export · ${esc(exportedOn)}</title>
<style>
  :root {
    --bg: #f7f2e9; --card: #fffdf9; --ink: #1c1917; --muted: #78716c;
    --primary: #bf502b; --accent: #f0e6d6; --line: #e7ddcc;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5; -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 820px; margin: 0 auto; padding: 40px 24px 64px; }
  h1, h2, .brand { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; }
  .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; }
  .brand .dot {
    width: 26px; height: 26px; border-radius: 8px;
    background: linear-gradient(135deg, #E0864F, #9A3412);
    display: inline-block;
  }
  header {
    border-bottom: 1px solid var(--line); padding-bottom: 24px; margin-bottom: 28px;
  }
  h1 { font-size: 30px; margin: 20px 0 6px; letter-spacing: -0.01em; }
  .sub { color: var(--muted); font-size: 14px; }
  .tiles { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
  .tile {
    flex: 1 1 110px; background: var(--card); border: 1px solid var(--line);
    border-radius: 14px; padding: 14px 16px;
  }
  .tile-n { font-size: 26px; font-weight: 700; font-family: Georgia, serif; }
  .tile-l { color: var(--muted); font-size: 13px; }
  section { margin-top: 34px; }
  h2 { font-size: 20px; margin: 0 0 14px; display: flex; align-items: baseline; gap: 10px; }
  .count {
    font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 600;
    color: var(--primary); background: var(--accent); border-radius: 999px;
    padding: 2px 10px;
  }
  .cards { display: grid; gap: 10px; }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: 14px;
    padding: 14px 16px;
  }
  .card-title { font-weight: 600; }
  .card-meta { color: var(--muted); font-size: 13px; margin-top: 3px; }
  .card-body { margin-top: 8px; font-size: 14px; }
  .card-body p { margin: 0; white-space: pre-wrap; }
  .pill {
    display: inline-block; font-size: 11px; font-weight: 600; text-transform: capitalize;
    color: var(--primary); background: var(--accent); border-radius: 999px; padding: 1px 8px;
  }
  .empty { color: var(--muted); font-size: 14px; font-style: italic; }
  footer {
    margin-top: 44px; padding-top: 20px; border-top: 1px solid var(--line);
    color: var(--muted); font-size: 12px;
  }
  @media print {
    body { background: #fff; }
    .card, .tile { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand"><span class="dot"></span> DailyOS</div>
      <h1>Your data export</h1>
      <div class="sub">Exported ${esc(exportedOn)} · ${esc(data.account?.email ?? "your account")}</div>
      <div class="tiles">${tiles}</div>
    </header>

    ${section("Tasks", tasks.length, "No tasks.", tasksHtml)}
    ${section("Calendar events", events.length, "No events.", eventsHtml)}
    ${section("Notes", notes.length, "No notes.", notesHtml)}
    ${section("The Drop", inbox.length, "Nothing in the Drop.", inboxHtml)}
    ${section("Vault", vault.length, "The vault is empty.", vaultHtml)}

    <footer>
      A complete copy of your DailyOS data. Keep it somewhere safe — it&rsquo;s
      yours. Life admin, handled.
    </footer>
  </div>
</body>
</html>`;
}
