import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/20 px-6">
      <div className="text-center">
        <Logo className="mx-auto" />
        <h1 className="mt-8 text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t find what you were looking for.
        </p>
        <Button asChild className="mt-6">
          <Link href="/today">Back to DailyOS</Link>
        </Button>
      </div>
    </div>
  );
}
