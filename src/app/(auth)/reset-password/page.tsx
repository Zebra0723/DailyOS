import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata = { title: "Set a new password · DailyOS" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
