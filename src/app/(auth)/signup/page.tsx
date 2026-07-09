import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign up · DailyOS" };

export default function SignupPage({
  searchParams,
}: {
  searchParams: { redirect?: string; ref?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Start your Life Inbox
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a free account and turn your life admin into handled.
        </p>
      </div>
      <AuthForm
        mode="signup"
        redirectTo={searchParams.redirect}
        refCode={searchParams.ref}
      />
    </div>
  );
}
