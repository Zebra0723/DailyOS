import { createClient } from "@/lib/supabase/server";
import { ShoppingList } from "@/components/shopping-list";

export const metadata = { title: "Shopping List · DailyOS" };

export default async function ShoppingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <ShoppingList userId={user?.id ?? "anon"} />;
}
