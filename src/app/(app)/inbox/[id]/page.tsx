import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ItemReview } from "@/components/item-review";
import type { InboxItem, ProcessingLog } from "@/lib/types";

export const metadata = { title: "Item · DailyOS" };

export default async function InboxItemPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Item and its logs are independent — fetch together.
  const [{ data: item }, { data: logs }] = await Promise.all([
    supabase.from("inbox_items").select("*").eq("id", params.id).single<InboxItem>(),
    supabase
      .from("processing_logs")
      .select("*")
      .eq("inbox_item_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!item) notFound();

  // Private bucket → mint a short-lived signed URL for the original file.
  let signedUrl: string | null = null;
  if (item.file_url) {
    const { data } = await supabase.storage
      .from("inbox-files")
      .createSignedUrl(item.file_url, 60 * 60);
    signedUrl = data?.signedUrl ?? null;
  }

  return (
    <div>
      <Link
        href="/inbox"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to the Drop
      </Link>

      <ItemReview
        item={item}
        logs={(logs ?? []) as ProcessingLog[]}
        signedUrl={signedUrl}
      />
    </div>
  );
}
