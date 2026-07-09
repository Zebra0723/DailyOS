import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Log in · DailyOS" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; ref?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to pick up where your life admin left off.
        </p>
      </div>
      <AuthForm
        mode="login"
        redirectTo={searchParams.redirect}
        refCode={searchParams.ref}
      />
    </div>
  );
}
