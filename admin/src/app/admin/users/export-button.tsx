"use client";

import { useTransition } from "react";
import { exportUsersCsv } from "./export-action";

/** Fetches the CSV from a server action and downloads it via a Blob. */
export function ExportButton() {
  const [pending, start] = useTransition();

  function download() {
    start(async () => {
      const csv = await exportUsersCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dailyos-users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={pending}
      style={{
        fontSize: 13,
        fontWeight: 600,
        cursor: pending ? "default" : "pointer",
        border: "1px solid #d9d2c6",
        background: "#fffdf9",
        color: "#1c1a17",
        borderRadius: 10,
        padding: "7px 12px",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Exporting…" : "Export CSV"}
    </button>
  );
}
