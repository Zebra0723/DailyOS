import Link from "next/link";
import { requireAdminUser } from "@/lib/admin-server";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/data", label: "Data" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/push", label: "Push" },
  { href: "/admin/account", label: "Account" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Link href="/admin" style={{ textDecoration: "none" }}><Logo /></Link>
        <span style={{ fontSize: 12, color: "#6b6157" }}>{user.email}</span>
      </div>
      <nav style={{ display: "flex", gap: 6, fontSize: 14, fontWeight: 600, flexWrap: "wrap", borderTop: "1px solid #e6ded2", borderBottom: "1px solid #e6ded2", padding: "10px 0", marginBottom: 24 }}>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} style={{ textDecoration: "none", padding: "4px 10px", borderRadius: 999 }}>
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
