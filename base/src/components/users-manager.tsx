"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Trash2, Save, Loader2, Mail } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import {
  createUserAction,
  deleteUserAction,
  updateMetadataAction,
} from "@/app/base/users/actions";

export type AuthUserRow = {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  metadata: Record<string, unknown>;
};

const teal = "#bf502b";

function fmt(d: string | null): string {
  if (!d) return "—";
  const t = new Date(d);
  return isNaN(t.getTime()) ? "—" : t.toLocaleDateString();
}

// Metadata keys we surface as first-class editable fields.
const META_KEYS = ["tier", "plan", "admin"] as const;

function EditUser({
  user,
  onClose,
  onSaved,
}: {
  user: AuthUserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [vals, setVals] = React.useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const k of META_KEYS) {
      const v = user.metadata[k];
      out[k] = v === undefined || v === null ? "" : String(v);
    }
    return out;
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await updateMetadataAction(user.id, vals);
      if (!res.ok) { setError(res.error ?? "Failed."); return; }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold">Edit metadata</h3>
          <button onClick={onClose} className="text-[#8a8073] hover:text-[#1c1a17]"><X className="size-5" /></button>
        </div>
        <p className="mb-3 truncate text-xs text-[#8a8073]">{user.email}</p>
        <div className="grid gap-3">
          {META_KEYS.map((k) => (
            <div key={k}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">
                {k} <span className="font-normal normal-case text-[#b0a89b]">(blank clears · true/false for admin)</span>
              </label>
              <input
                value={vals[k]}
                onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))}
                className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-white px-2.5 text-sm outline-none focus:border-[#bf502b]"
              />
            </div>
          ))}
        </div>
        {error && <div className="mt-3 rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-[#eae3d7] px-4 py-2 text-sm font-semibold text-[#1c1a17]">Cancel</button>
          <button onClick={save} disabled={busy} style={{ background: teal, opacity: busy ? 0.6 : 1 }} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateUser({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = React.useState("");
  const [mode, setMode] = React.useState<"invite" | "create">("invite");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await createUserAction(email, mode, password);
      if (!res.ok) { setError(res.error ?? "Failed."); return; }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">New user</h3>
          <button onClick={onClose} className="text-[#8a8073] hover:text-[#1c1a17]"><X className="size-5" /></button>
        </div>
        <div className="grid gap-3">
          <div className="flex gap-1.5">
            {(["invite", "create"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === m ? "bg-[#bf502b] text-white" : "border border-[#e6ded2] text-[#4b443b]"}`}
              >
                {m === "invite" ? "Send invite email" : "Create directly"}
              </button>
            ))}
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-white px-2.5 text-sm outline-none focus:border-[#bf502b]"
          />
          {mode === "create" && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password (optional, min 6 chars)"
              type="text"
              className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-white px-2.5 text-sm outline-none focus:border-[#bf502b]"
            />
          )}
        </div>
        {error && <div className="mt-3 rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-[#eae3d7] px-4 py-2 text-sm font-semibold text-[#1c1a17]">Cancel</button>
          <button onClick={submit} disabled={busy || !email.trim()} style={{ background: teal, opacity: busy || !email.trim() ? 0.6 : 1 }} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white">
            {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "invite" ? <Mail className="size-4" /> : <UserPlus className="size-4" />}
            {mode === "invite" ? "Send invite" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function metaBadges(m: Record<string, unknown>) {
  const chips: string[] = [];
  for (const k of META_KEYS) {
    if (m[k] !== undefined && m[k] !== null && m[k] !== "") chips.push(`${k}: ${String(m[k])}`);
  }
  return chips;
}

export function UsersManager({ users }: { users: AuthUserRow[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [editing, setEditing] = React.useState<AuthUserRow | null>(null);
  const [creating, setCreating] = React.useState(false);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => u.email.toLowerCase().includes(s));
  }, [q, users]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${filtered.length} user${filtered.length === 1 ? "" : "s"}…`}
          className="h-10 flex-1 rounded-lg border border-[#d9d2c6] bg-white px-3 text-sm outline-none focus:border-[#bf502b]"
        />
        <button onClick={() => setCreating(true)} style={{ background: teal }} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white">
          <UserPlus className="size-4" /> New user
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e6ded2]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f2e3d3] text-xs">
            <tr>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Metadata</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Created</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Last sign in</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-4 text-[#8a8073]">No users.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-[#efe6d8]">
                  <td className="max-w-[220px] truncate px-3 py-2">{u.email || <span className="text-[#b0a89b]">—</span>}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {metaBadges(u.metadata).map((c) => (
                        <span key={c} className="rounded bg-[#e0f2f1] px-1.5 py-0.5 text-[11px] font-medium" style={{ color: "#a5401f" }}>{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6b6157]">{fmt(u.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6b6157]">{fmt(u.lastSignInAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => setEditing(u)} className="rounded-lg border border-[#a7d8d3] bg-[#e0f2f1] px-2.5 py-1 text-xs font-semibold" style={{ color: "#a5401f" }}>Edit</button>
                      <ConfirmButton
                        label={<Trash2 className="size-3.5" />}
                        style={{ display: "inline-flex", alignItems: "center", background: "#fbe9e7", color: "#9a3412", border: "1px solid #f0c4bd", borderRadius: 8, padding: "5px 8px", cursor: "pointer" }}
                        title="Delete this user?"
                        message={`Permanently deletes ${u.email || u.id} from auth.`}
                        warn="This can't be undone."
                        onConfirm={async () => { await deleteUserAction(u.id); router.refresh(); }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && <EditUser user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />}
      {creating && <CreateUser onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
    </div>
  );
}
