"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Save, X } from "lucide-react";
import type { EnvVar } from "@/lib/vercel";
import { ConfirmButton } from "@/components/confirm-button";
import { createEnvAction, updateEnvAction, deleteEnvAction } from "@/app/deploy/actions";

const TARGETS = ["production", "preview", "development"] as const;
const TYPES = ["encrypted", "plain", "sensitive"] as const;

const INPUT: React.CSSProperties = {
  border: "1px solid #e6ded2",
  background: "#fffdf9",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 13,
  width: "100%",
};
const DARK_BTN: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#bf502b",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "7px 12px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

function TargetPills({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TARGETS.map((t) => {
        const on = selected.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            className="rounded-md px-2 py-1 text-[11px] font-semibold"
            style={on ? { background: "#bf502b", color: "#fff" } : { background: "#e5e7eb", color: "#374151" }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function AddForm({ onDone }: { onDone: () => void }) {
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [type, setType] = React.useState<string>("encrypted");
  const [target, setTarget] = React.useState<string[]>(["production", "preview", "development"]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  function toggle(t: string) {
    setTarget((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    const r = await createEnvAction({ key, value, type, target });
    setBusy(false);
    if (r.ok) {
      setKey("");
      setValue("");
      onDone();
    } else {
      setMsg(r.error ?? "Failed.");
    }
  }

  return (
    <div className="grid gap-3 rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-4">
      <h2 className="text-sm font-bold">Add variable</h2>
      <div className="grid gap-2 md:grid-cols-2">
        <input style={INPUT} placeholder="KEY" value={key} onChange={(e) => setKey(e.target.value)} />
        <input style={INPUT} placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <TargetPills selected={target} onToggle={toggle} />
        <select style={{ ...INPUT, width: "auto" }} value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="button" style={{ ...DARK_BTN, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={submit}>
          <Plus className="size-4" /> {busy ? "Adding…" : "Add"}
        </button>
      </div>
      {msg && <p className="text-sm text-[#9a3412]">{msg}</p>}
    </div>
  );
}

function Row({ env, onChanged }: { env: EnvVar; onChanged: () => void }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(env.value ?? "");
  const [target, setTarget] = React.useState<string[]>(env.target);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  function toggle(t: string) {
    setTarget((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await updateEnvAction(env.id, { value, target });
    setBusy(false);
    if (r.ok) {
      setEditing(false);
      onChanged();
    } else {
      setMsg(r.error ?? "Failed.");
    }
  }

  return (
    <div className="rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm font-bold text-[#1c1a17]">{env.key}</code>
        <span className="rounded-md bg-[#e5e7eb] px-1.5 py-0.5 text-[10px] font-semibold text-[#374151]">{env.type}</span>
        <span className="ml-auto text-xs text-[#8a8073]">
          {env.updatedAt ? new Date(env.updatedAt).toLocaleDateString() : ""}
        </span>
      </div>

      {!editing ? (
        <>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {env.target.map((t) => (
              <span key={t} className="rounded-md bg-[#bf502b] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {t}
              </span>
            ))}
            <span className="ml-1 text-xs text-[#8a8073]">{env.value != null ? env.value : "•••••••• (hidden)"}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] px-2.5 py-1 text-xs font-semibold text-[#4b443b] hover:bg-[#f3ede2]"
            >
              <Pencil className="size-3.5" /> Edit
            </button>
            <ConfirmButton
              label="Delete"
              style={{ background: "#c0392b", color: "#fff", border: 0, borderRadius: 8, padding: "5px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
              title={`Delete ${env.key}?`}
              message="This permanently removes the environment variable from the Vercel project."
              warn="Builds relying on this variable may break."
              confirmLabel="Delete variable"
              onConfirm={async () => {
                await deleteEnvAction(env.id);
                onChanged();
              }}
            />
          </div>
        </>
      ) : (
        <div className="mt-2 grid gap-2">
          <input style={INPUT} placeholder="new value" value={value} onChange={(e) => setValue(e.target.value)} />
          <TargetPills selected={target} onToggle={toggle} />
          <div className="flex items-center gap-2">
            <button type="button" style={{ ...DARK_BTN, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={save}>
              <Save className="size-4" /> {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] px-2.5 py-1.5 text-xs font-semibold text-[#4b443b] hover:bg-[#f3ede2]"
            >
              <X className="size-3.5" /> Cancel
            </button>
          </div>
          {msg && <p className="text-sm text-[#9a3412]">{msg}</p>}
        </div>
      )}
    </div>
  );
}

export function EnvManager({ envs }: { envs: EnvVar[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  return (
    <div className="grid gap-3">
      <AddForm onDone={refresh} />
      {envs.length === 0 ? (
        <p className="text-sm text-[#8a8073]">No environment variables found.</p>
      ) : (
        envs.map((e) => <Row key={e.id} env={e} onChanged={refresh} />)
      )}
    </div>
  );
}
