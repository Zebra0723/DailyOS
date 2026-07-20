import { createServiceClient } from "@/lib/supabase/service";
import { StorageBrowser, type BucketInfo, type ObjectInfo } from "@/components/storage-browser";

export const dynamic = "force-dynamic";

function serviceConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function StoragePage({ searchParams }: { searchParams: { b?: string } }) {
  if (!serviceConfigured()) {
    return (
      <div className="grid gap-5">
        <div>
          <h1 className="text-2xl font-bold">Storage</h1>
          <p className="text-sm text-[#6b6157]">Buckets and objects.</p>
        </div>
        <div className="rounded-2xl border border-[#f0c4bd] bg-[#fbe9e7] p-4 text-sm text-[#9a3412]">
          Service role not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> to browse storage.
        </div>
      </div>
    );
  }

  const admin = createServiceClient();
  let buckets: BucketInfo[] = [];
  let error: string | null = null;
  try {
    const { data, error: err } = await admin.storage.listBuckets();
    if (err) error = err.message;
    else buckets = (data ?? []).map((b) => ({ id: b.id, name: b.name, isPublic: b.public }));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const current = buckets.find((b) => b.name === searchParams.b) ?? buckets[0] ?? null;

  let objects: ObjectInfo[] = [];
  let objError: string | null = null;
  if (current) {
    try {
      const { data, error: err } = await admin.storage
        .from(current.name)
        .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
      if (err) objError = err.message;
      else
        objects = (data ?? []).map((o) => ({
          name: o.name,
          size: (o.metadata as { size?: number } | null)?.size ?? null,
          updatedAt: o.updated_at ?? null,
          isFolder: o.id === null,
        }));
    } catch (e) {
      objError = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Storage</h1>
        <p className="text-sm text-[#6b6157]">Buckets and objects.</p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-[#f0c4bd] bg-[#fbe9e7] p-4 text-sm text-[#9a3412]">{error}</div>
      ) : buckets.length === 0 ? (
        <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4 text-sm text-[#6b6157]">
          No storage buckets exist yet. Create one from the Supabase dashboard.
        </div>
      ) : (
        <StorageBrowser
          buckets={buckets}
          current={current!}
          objects={objects}
          objError={objError}
        />
      )}
    </div>
  );
}
