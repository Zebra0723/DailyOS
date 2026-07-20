import { managementConfigured } from "@/lib/management";
import { MIGRATIONS } from "@/lib/migrations";
import { SqlConsole } from "@/components/sql-console";

export const dynamic = "force-dynamic";

export default function SqlPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">SQL</h1>
        <p className="text-sm text-[#6b6157]">Run SQL against your DailyOS database, or apply the setup in one tap.</p>
      </div>
      <SqlConsole
        configured={managementConfigured()}
        migrations={MIGRATIONS.map((m) => m.label)}
      />
    </div>
  );
}
