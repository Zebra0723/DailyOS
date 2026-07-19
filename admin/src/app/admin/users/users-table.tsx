"use client";

import { useMemo, useState } from "react";
import { UserRow } from "./user-row";

export type UserRowData = {
  id: string;
  email: string;
  tier: string;
  isAdmin: boolean;
  suspended: boolean;
  createdAt: string;
};

export function UsersTable({ users }: { users: UserRowData[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter((u) => u.email.toLowerCase().includes(s)) : users;
  }, [q, users]);

  const th: React.CSSProperties = { padding: "8px 10px" };

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by email…"
        style={{ width: "100%", maxWidth: 320, height: 40, borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff", color: "inherit", padding: "0 12px", fontSize: 14, marginBottom: 14, boxSizing: "border-box" }}
      />
      <p style={{ color: "#6b6157", fontSize: 13, margin: "0 0 10px" }}>
        {filtered.length} of {users.length} account{users.length === 1 ? "" : "s"}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b6157", fontSize: 12 }}>
              <th style={th}>Email</th>
              <th style={th}>Status</th>
              <th style={th}>Plan</th>
              <th style={th}>Admin</th>
              <th style={th}>Joined</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <UserRow key={u.id} id={u.id} email={u.email} tier={u.tier} isAdmin={u.isAdmin} suspended={u.suspended} createdAt={u.createdAt} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
