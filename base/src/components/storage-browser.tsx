"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Link2, Folder, FileText, Check, Loader2 } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteObjectAction, getObjectUrlAction } from "@/app/base/storage/actions";

export type BucketInfo = { id: string; name: string; isPublic: boolean };
export type ObjectInfo = {
  name: string;
  size: number | null;
  updatedAt: string | null;
  isFolder: boolean;
};

function fmtSize(n: number | null): string {
  if (n === null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function CopyUrlButton({ bucket, path, isPublic }: { bucket: string; path: string; isPublic: boolean }) {
  const [state, setState] = React.useState<"idle" | "busy" | "done" | "err">("idle");

  async function go() {
    setState("busy");
    const res = await getObjectUrlAction(bucket, path, isPublic);
    if (res.ok && res.url) {
      try {
        await navigator.clipboard.writeText(res.url);
        setState("done");
      } catch {
        window.prompt("Copy this URL:", res.url);
        setState("done");
      }
      setTimeout(() => setState("idle"), 1800);
    } else {
      setState("err");
      setTimeout(() => setState("idle"), 1800);
    }
  }

  return (
    <button
      onClick={go}
      disabled={state === "busy"}
      title={isPublic ? "Copy public URL" : "Copy 1-hour signed URL"}
      className="inline-flex items-center gap-1 rounded-lg border border-[#a7d8d3] bg-[#e0f2f1] px-2.5 py-1 text-xs font-semibold"
      style={{ color: state === "err" ? "#9a3412" : "#a5401f" }}
    >
      {state === "busy" ? <Loader2 className="size-3.5 animate-spin" /> : state === "done" ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
      {state === "done" ? "Copied" : state === "err" ? "Failed" : "URL"}
    </button>
  );
}

export function StorageBrowser({
  buckets,
  current,
  objects,
  objError,
}: {
  buckets: BucketInfo[];
  current: BucketInfo;
  objects: ObjectInfo[];
  objError: string | null;
}) {
  const router = useRouter();

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5">
        {buckets.map((b) => (
          <button
            key={b.id}
            onClick={() => router.push(`/base/storage?b=${encodeURIComponent(b.name)}`)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              b.name === current.name ? "bg-[#bf502b] text-white" : "border border-[#e6ded2] bg-[#fffdf9] text-[#4b443b] hover:border-[#bf502b]"
            }`}
          >
            {b.name}
            <span className={`rounded px-1 py-0.5 text-[10px] ${b.name === current.name ? "bg-white/20" : "bg-[#f2e3d3]"}`}>
              {b.isPublic ? "public" : "private"}
            </span>
          </button>
        ))}
      </div>

      {objError ? (
        <div className="rounded-2xl border border-[#f0c4bd] bg-[#fbe9e7] p-4 text-sm text-[#9a3412]">{objError}</div>
      ) : objects.length === 0 ? (
        <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4 text-sm text-[#6b6157]">
          No objects at the root of <span className="font-semibold">{current.name}</span>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e6ded2]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f2e3d3] text-xs">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Size</th>
                <th className="px-3 py-2 font-semibold">Updated</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {objects.map((o) => (
                <tr key={o.name} className="border-t border-[#efe6d8]">
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      {o.isFolder ? <Folder className="size-4 text-[#8a8073]" /> : <FileText className="size-4 text-[#8a8073]" />}
                      <span className="max-w-[280px] truncate">{o.name}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6b6157]">{o.isFolder ? "folder" : fmtSize(o.size)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6b6157]">
                    {o.updatedAt ? new Date(o.updatedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {o.isFolder ? null : (
                      <div className="inline-flex items-center gap-2">
                        <CopyUrlButton bucket={current.name} path={o.name} isPublic={current.isPublic} />
                        <ConfirmButton
                          label={<Trash2 className="size-3.5" />}
                          style={{ display: "inline-flex", alignItems: "center", background: "#fbe9e7", color: "#9a3412", border: "1px solid #f0c4bd", borderRadius: 8, padding: "5px 8px", cursor: "pointer" }}
                          title="Delete this object?"
                          message={`Permanently deletes ${o.name} from ${current.name}.`}
                          warn="This can't be undone."
                          onConfirm={async () => { await deleteObjectAction(current.name, o.name); router.refresh(); }}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
