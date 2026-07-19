import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/** Ensure the current request is an allow-listed admin, or bounce to /verify.
 *  Call this in the admin layout AND every admin server action. */
export async function requireAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/verify");
  return user;
}
