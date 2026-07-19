"use client";

import { useTransition } from "react";
import { deleteRow } from "./actions";
import { type DataTable } from "./tables";
import { ConfirmButton } from "@/components/confirm-button";

export function DeleteButton({ table, id }: { table: DataTable; id: string }) {
  const [, start] = useTransition();
  return (
    <ConfirmButton
      label="Delete"
      style={{ background: "#c0392b", color: "#fff", border: 0, borderRadius: 8, padding: "3px 9px", cursor: "pointer", fontSize: 12 }}
      title="Delete this row?"
      message={`This permanently removes this row from ${table}.`}
      warn="This belongs to a real user and can't be recovered."
      confirmLabel="Delete row"
      onConfirm={() => start(() => { void deleteRow(table, id); })}
    />
  );
}
