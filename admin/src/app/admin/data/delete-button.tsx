"use client";

import { useTransition } from "react";
import { deleteRow, type DataTable } from "./actions";

export function DeleteButton({ table, id }: { table: DataTable; id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this row permanently?")) start(() => { void deleteRow(table, id); });
      }}
      style={{ background: "#c0392b", color: "#fff", border: 0, borderRadius: 8, padding: "3px 9px", cursor: "pointer", fontSize: 12 }}
    >
      Delete
    </button>
  );
}
