import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CaptureForm } from "@/components/capture-form";

export const metadata = { title: "Add to Inbox · DailyOS" };

export default async function NewInboxPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add to Inbox"
        description="Paste text or upload a file. DailyOS will read it and suggest tasks, events and where it should live."
      />
      <Card>
        <CardContent className="pt-5">
          <CaptureForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
