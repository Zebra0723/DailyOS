import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_VERSION } from "@/lib/version";

/** A prominent footer for signed-in pages: quick links to help, contact and the
 *  legal docs, so they're always one tap away from anywhere in the app. */
export function AppFooter() {
  return (
    <footer className="mt-10 border-t bg-card/40">
      <div className="container max-w-6xl py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Life admin, handled.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm sm:gap-16">
            <div>
              <p className="mb-3 font-semibold">Support</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-foreground">
                    Help &amp; FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold">Legal</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-foreground">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DailyOS. Life admin, handled.</p>
          <p>{APP_VERSION}</p>
        </div>
      </div>
    </footer>
  );
}
