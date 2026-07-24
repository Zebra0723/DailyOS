import { redirect } from "next/navigation";
import { currentAdminEmail } from "@/lib/admin-auth";

/** Ensure the request is a signed-in admin, or bounce to /verify. Returns a
 *  minimal user ({ email, id }) so existing callers (`user.email`) keep working. */
export async function requireAdminUser(): Promise<{ email: string; id: string }> {
  const email = currentAdminEmail();
  if (!email) redirect("/verify");
  return { email, id: email };
}
