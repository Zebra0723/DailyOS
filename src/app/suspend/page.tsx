import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/server";
import { verifySuspendToken } from "@/lib/admin-token";

export const metadata = { title: "Suspend account · DailyOS" };

/** Actually suspend the account. This runs only on the POST (button click), so
 *  email link-prefetching can never trigger it. */
async function suspend(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const userId = verifySuspendToken(token);
  if (!userId) redirect("/suspend?state=invalid");
  try {
    const admin = createServiceClient();
    // Ban for ~100 years — effectively suspended; they can't refresh a session.
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
    redirect(error ? "/suspend?state=error" : "/suspend?state=done");
  } catch {
    redirect("/suspend?state=error");
  }
}

export default function SuspendPage({
  searchParams,
}: {
  searchParams: { token?: string; state?: string };
}) {
  const state = searchParams.state;
  const token = searchParams.token ?? "";
  const userId = token ? verifySuspendToken(token) : null;

  return (
    <div className="grid min-h-screen place-items-center bg-muted/20 px-6">
      <div className="w-full max-w-md text-center">
        <Logo className="mx-auto" />
        <div className="mt-8 rounded-2xl border bg-card p-8 shadow-card">
          {state === "done" ? (
            <>
              <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
              <h1 className="mt-4 text-xl font-semibold">Account suspended</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The account has been suspended and can no longer sign in.
              </p>
            </>
          ) : state === "invalid" || (!userId && !state) ? (
            <>
              <XCircle className="mx-auto size-8 text-muted-foreground" />
              <h1 className="mt-4 text-xl font-semibold">Link not valid</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This suspend link is invalid or has expired.
              </p>
            </>
          ) : state === "error" ? (
            <>
              <XCircle className="mx-auto size-8 text-destructive" />
              <h1 className="mt-4 text-xl font-semibold">Couldn&apos;t suspend</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Something went wrong. Check the server has the service-role key
                set, then try again.
              </p>
            </>
          ) : (
            <>
              <ShieldAlert className="mx-auto size-8 text-destructive" />
              <h1 className="mt-4 text-xl font-semibold">Suspend this account?</h1>
              <p className="mt-2 break-all text-sm text-muted-foreground">
                Account ID: {userId}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                They&apos;ll be signed out and blocked from signing back in. You
                can reverse this later from Supabase.
              </p>
              <form action={suspend} className="mt-5">
                <input type="hidden" name="token" value={token} />
                <Button type="submit" variant="destructive" className="w-full">
                  Suspend account
                </Button>
              </form>
            </>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link href="/today">Back to DailyOS</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
