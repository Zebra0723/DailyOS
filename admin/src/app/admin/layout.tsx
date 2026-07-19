import Link from "next/link";
import { requireAdminUser } from "@/lib/admin-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #3a322a", paddingBottom: 14, marginBottom: 24 }}>
        <nav style={{ display: "flex", gap: 16, fontSize: 14, fontWeight: 600 }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/users">Users</Link>
        </nav>
        <span style={{ fontSize: 12, color: "#a99f92" }}>{user.email}</span>
      </header>
      {children}
    </div>
  );
}
