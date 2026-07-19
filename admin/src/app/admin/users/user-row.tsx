"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setUserPlan, setUserAdmin, setUserSuspended, deleteUser } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

type Tier = "free" | "plus" | "pro";

export function UserRow({
  id,
  email,
  tier,
  isAdmin,
  suspended,
  createdAt,
}: {
  id: string;
  email: string;
  tier: string;
  isAdmin: boolean;
  suspended: boolean;
  createdAt: string;
}) {
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<string>(tier);
  const [admin, setAdmin] = useState(isAdmin);
  const [banned, setBanned] = useState(suspended);

  const cell: React.CSSProperties = { padding: "8px 10px", borderTop: "1px solid #eee6da", whiteSpace: "nowrap" };
  const btn = (bg: string, fg = "#fff"): React.CSSProperties => ({
    background: bg, color: fg, border: 0, borderRadius: 8, padding: "4px 10px", cursor: "pointer",
  });

  return (
    <tr style={{ opacity: pending ? 0.5 : 1 }}>
      <td style={{ ...cell, whiteSpace: "normal" }}>
        <Link href={`/admin/users/${id}`} style={{ color: "#bf502b", textDecoration: "none" }}>{email}</Link>
      </td>
      <td style={cell}>
        <span style={{ fontSize: 12, fontWeight: 600, color: banned ? "#b23b2b" : "#2f8f5f" }}>
          {banned ? "Suspended" : "Active"}
        </span>
      </td>
      <td style={cell}>
        <select
          value={plan}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as Tier;
            setPlan(next);
            start(() => { void setUserPlan(id, next); });
          }}
          style={{ background: "#fff", color: "inherit", border: "1px solid #d9d2c6", borderRadius: 8, padding: "4px 8px" }}
        >
          <option value="free">free</option>
          <option value="plus">plus</option>
          <option value="pro">pro</option>
        </select>
      </td>
      <td style={cell}>
        <button
          disabled={pending}
          onClick={() => {
            const next = !admin;
            setAdmin(next);
            start(() => { void setUserAdmin(id, next); });
          }}
          style={btn(admin ? "#2f8f5f" : "#eae3d7", admin ? "#fff" : "#1c1a17")}
        >
          {admin ? "Yes" : "No"}
        </button>
      </td>
      <td style={cell}>{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}</td>
      <td style={cell}>
        <span style={{ display: "inline-flex", gap: 6 }}>
          {banned ? (
            <button
              disabled={pending}
              onClick={() => { setBanned(false); start(() => { void setUserSuspended(id, false); }); }}
              style={btn("#7a6a12")}
            >
              Unsuspend
            </button>
          ) : (
            <ConfirmButton
              label="Suspend"
              style={btn("#c98a1a")}
              title="Suspend this account?"
              message={`${email} won't be able to sign in until you unsuspend them.`}
              warn="This locks out a real person's account."
              confirmLabel="Suspend"
              onConfirm={() => { setBanned(true); start(() => { void setUserSuspended(id, true); }); }}
            />
          )}
          <ConfirmButton
            label="Delete"
            style={btn("#c0392b")}
            title="Delete this account?"
            message={`${email}'s account will be permanently removed.`}
            warn="This permanently deletes a real person's account and cannot be undone."
            confirmLabel="Delete account"
            onConfirm={() => start(() => { void deleteUser(id); })}
          />
        </span>
      </td>
    </tr>
  );
}
