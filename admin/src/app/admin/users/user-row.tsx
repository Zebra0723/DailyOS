"use client";

import { useState, useTransition } from "react";
import { setUserPlan, setUserAdmin, deleteUser } from "../actions";

type Tier = "free" | "plus" | "pro";

export function UserRow({
  id,
  email,
  tier,
  isAdmin,
  createdAt,
}: {
  id: string;
  email: string;
  tier: string;
  isAdmin: boolean;
  createdAt: string;
}) {
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<string>(tier);
  const [admin, setAdmin] = useState(isAdmin);

  const cell: React.CSSProperties = { padding: "8px 10px", borderTop: "1px solid #2a251f" };

  return (
    <tr style={{ opacity: pending ? 0.5 : 1 }}>
      <td style={cell}>{email}</td>
      <td style={cell}>
        <select
          value={plan}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as Tier;
            setPlan(next);
            start(() => { void setUserPlan(id, next); });
          }}
          style={{ background: "#201b15", color: "inherit", border: "1px solid #3a322a", borderRadius: 8, padding: "4px 8px" }}
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
          style={{ background: admin ? "#2f6a4c" : "#3a322a", color: "#fff", border: 0, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}
        >
          {admin ? "Yes" : "No"}
        </button>
      </td>
      <td style={cell}>{createdAt ? new Date(createdAt).toLocaleDateString() : "—"}</td>
      <td style={cell}>
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete ${email}? This removes their account permanently.`)) {
              start(() => { void deleteUser(id); });
            }
          }}
          style={{ background: "#6a2f2f", color: "#fff", border: 0, borderRadius: 8, padding: "4px 10px", cursor: "pointer" }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
