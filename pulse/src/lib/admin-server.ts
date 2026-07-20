import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/** Ensure the request is an allow-listed admin, or bounce to /verify.
 *  Call this in the /base layout AND every server action. */
export async function requireAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) redirect("/verify");
  return user;
}
