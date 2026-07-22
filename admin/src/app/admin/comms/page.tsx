import { requireAdminUser } from "@/lib/admin-server";
import { loadMessages } from "@/lib/comms";
import { CommsThread } from "./comms-thread";

export const dynamic = "force-dynamic";

export default async function CommsPage() {
  const user = await requireAdminUser();
  const messages = await loadMessages();

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Comms</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 16px" }}>
        A private thread between the two admins — Arjun and Leo. Just the two of you.
      </p>
      <CommsThread initial={messages} email={user.email ?? ""} />
    </div>
  );
}
