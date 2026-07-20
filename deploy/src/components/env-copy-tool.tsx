"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy } from "lucide-react";
import type { EnvVar } from "@/lib/vercel";
import { ConfirmButton } from "@/components/confirm-button";
import { copyEnvAcrossTargetsAction } from "@/app/deploy/actions";

const TARGETS = ["production", "preview", "development"] as const;

const INPUT: React.CSSProperties = {
  border: "1px solid #e6ded2",
  background: "#fffdf9",
  borderRadius: 8,
  padding: "7px 10px",
  fontSize: 13,
};
const COPY_BTN: React.CSSProperties = {
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

export function EnvCopyTool({ envs }: { envs: EnvVar[] }) {
  const router = useRouter();
  const keys = React.useMemo(
    () => Array.from(new Set(envs.map((e) => e.key))).sort((a, b) => a.localeCompare(b)),
    [envs],
  );

  const [key, setKey] = React.useState(keys[0] ?? "");
  const [fromTarget, setFromTarget] = React.useState<string>("preview");
  const [toTarget, setToTarget] = React.useState<string>("production");
  const [value, setValue] = React.useState("");
  const [needsValue, setNeedsValue] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const source = envs.find((e) => e.key === key && e.target.includes(fromTarget));
  const sourceValueKnown = source?.value != null;

  async function apply() {
    setMsg(null);
    const r = await copyEnvAcrossTargetsAction({
      key,
      fromTarget,
      toTarget,
      value: value || undefined,
    });
    if (r.ok) {
      setNeedsValue(false);
      setValue("");
      setMsg({ ok: true, text: `Copied ${key} → ${toTarget}. Refreshing…` });
      setTimeout(() => router.refresh(), 1200);
    } else {
      setNeedsValue(Boolean(r.needsValue));
      setMsg({ ok: false, text: r.error ?? "Failed." });
    }
  }

  if (keys.length === 0) return null;

  return (
    <div className="grid gap-3 rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
      <div className="flex items-center gap-2">
        <Copy className="size-4 text-[#bf502b]" />
        <h2 className="text-sm font-bold">Copy value between targets</h2>
      </div>
      <p className="text-sm text-[#6b6157]">
        Copy an existing variable&apos;s value from one target to another (e.g. preview → production).
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">
          Variable
          <select style={{ ...INPUT, minWidth: 160 }} value={key} onChange={(e) => setKey(e.target.value)}>
            {keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">
          From
          <select style={INPUT} value={fromTarget} onChange={(e) => setFromTarget(e.target.value)}>
            {TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <ArrowRight className="mb-2 size-4 text-[#8a8073]" />

        <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">
          To
          <select style={INPUT} value={toTarget} onChange={(e) => setToTarget(e.target.value)}>
            {TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(!sourceValueKnown || needsValue) && (
        <div className="grid gap-1.5 rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3">
          <p className="text-xs font-semibold text-[#9a3412]">
            This variable is write-only on Vercel — its value can&apos;t be read back. Paste the value to copy it across.
          </p>
          <input
            style={{ ...INPUT, width: "100%" }}
            type="password"
            placeholder={`value to write to ${toTarget}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton
          label={
            <span className="inline-flex items-center gap-1.5">
              <Copy className="size-4" /> Copy value
            </span>
          }
          style={COPY_BTN}
          title={`Copy ${key} to ${toTarget}?`}
          message={`This writes the value of ${key} from ${fromTarget} into ${toTarget}, overwriting any existing value on ${toTarget}.`}
          warn={
            toTarget === "production"
              ? "This changes a production environment variable — the next production build will use the new value."
              : undefined
          }
          confirmLabel="Copy value"
          onConfirm={apply}
        />
        {msg && (
          <span className={`text-xs ${msg.ok ? "text-[#166534]" : "text-[#9a3412]"}`}>{msg.text}</span>
        )}
      </div>
    </div>
  );
}
