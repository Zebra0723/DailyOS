import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import { stripeConfigured } from "@/lib/stripe";
import { listRecentPromoCodes } from "@/lib/stripe-promo";
import { CodesForm } from "./codes-form";

export const dynamic = "force-dynamic";

export default async function AdminCodesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) redirect("/today");

  const ready = stripeConfigured();
  const codes = ready ? await listRecentPromoCodes(25) : [];

  return (
    <div className="space-y-6">
      <CodesForm stripeReady={ready} />

      <div className="rounded-2xl border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-medium">Recent codes</h2>
        {!ready ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Connect Stripe (set <code>STRIPE_SECRET_KEY</code>) to see the codes
            you&apos;ve created.
          </p>
        ) : codes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No codes yet. Generate one above.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Discount</th>
                  <th className="py-2 pr-4 font-medium">Applies</th>
                  <th className="py-2 pr-4 font-medium">Used</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 pr-4 font-mono font-semibold">{c.code}</td>
                    <td className="py-2 pr-4">{c.discount}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{c.duration}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {c.timesRedeemed}
                      {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          c.active
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        }
                      >
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Manage and deactivate codes in your{" "}
          <a
            href="https://dashboard.stripe.com/coupons"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Stripe dashboard
          </a>
          .
        </p>
      </div>
    </div>
  );
}
