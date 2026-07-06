import Link from "next/link";
import { Inbox as InboxIcon, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InboxList } from "@/components/inbox-list";
import { Button } from "@/components/ui/button";
import type { InboxItem } from "@/lib/types";

export const metadata = { title: "Inbox · DailyOS" };

export default async function InboxPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("inbox_items")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as InboxItem[];

  return (
    <div>
      <PageHeader
        title="Life Inbox"
        description="Everything you've dropped in. We read it and suggest what to do."
        action={
          <Button asChild>
            <Link href="/inbox/new">
              <Plus className="size-4" />
              Add to Inbox
            </Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Your inbox is empty"
          description="Drop in a receipt, booking, school letter or screenshot and DailyOS will turn it into tasks, events and a tidy vault entry."
          actionLabel="Add your first item"
          actionHref="/inbox/new"
        />
      ) : (
        <InboxList items={items} />
      )}
    </div>
  );
}
