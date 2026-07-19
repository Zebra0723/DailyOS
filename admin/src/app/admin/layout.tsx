import Link from "next/link";
import { requireAdminUser } from "@/lib/admin-server";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/data", label: "Data" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/push", label: "Push" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #e6ded2", paddingBottom: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <nav style={{ display: "flex", gap: 16, fontSize: 14, fontWeight: 600, flexWrap: "wrap" }}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>
        <span style={{ fontSize: 12, color: "#6b6157" }}>{user.email}</span>
      </header>
      {children}
    </div>
  );
}
