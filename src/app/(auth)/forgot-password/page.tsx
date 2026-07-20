import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = { title: "Reset password · DailyOS" };
// Don't statically prerender — the form builds a Supabase client at render,
// which needs runtime env. Prerendering it fails the whole build (and blocks
// every Vercel deploy). Rendering on demand avoids that.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
      </div>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
