import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Log in · DailyOS" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to pick up where your life admin left off.
        </p>
      </div>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
