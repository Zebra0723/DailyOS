"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markSessionStart } from "@/lib/session-expiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function AuthForm({
  mode,
  redirectTo,
  refCode,
}: {
  mode: "login" | "signup";
  redirectTo?: string;
  refCode?: string;
}) {
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  // Read straight from the inputs at submit so browser/password-manager autofill
  // is always captured — iOS/Safari don't reliably fire React's onChange on fill.
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentConfirmation, setSentConfirmation] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  // Off by default: a plain login lasts 30 days; ticking it stretches to 1 year.
  const [remember, setRemember] = React.useState(false);

  // Email-OTP second factor on login. Gated behind an env flag so it can only
  // be switched on AFTER Supabase's OTP email template is configured (otherwise
  // users get a link with no code and can't finish logging in). Default: off.
  const REQUIRE_OTP = process.env.NEXT_PUBLIC_REQUIRE_LOGIN_OTP === "true";
  const [otpStage, setOtpStage] = React.useState(false);
  const [otpEmail, setOtpEmail] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [resendIn, setResendIn] = React.useState(0);

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // New sign-ups go through onboarding (which hands off to the welcome tour on
  // first run); a normal login lands straight on Today — the welcome tour must
  // never be forced on a returning user. A `redirect` param (e.g. from a
  // protected page) takes priority — but only if it's a same-origin path ("/…"),
  // never an absolute/protocol-relative URL, so a crafted ?redirect=https://evil.com
  // can't bounce you off-site after login.
  const safe =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const redirect = safe || (mode === "signup" ? "/onboarding" : "/today");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    // Prefer the live DOM value (catches autofill), fall back to React state.
    const emailVal = (emailRef.current?.value || email).trim();
    const passwordVal = passwordRef.current?.value || password;
    if (!emailVal || !passwordVal) {
      setError("Please enter your email and password.");
      return;
    }
    // Keep React state in sync with whatever autofill put in the fields.
    setEmail(emailVal);
    setPassword(passwordVal);
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        // Attribute the signup to a referrer if they arrived via a ?ref link.
        const referredBy = refCode;
        const { data, error } = await supabase.auth.signUp({
          email: emailVal,
          password: passwordVal,
          options: {
            data: referredBy ? { referred_by: referredBy } : undefined,
            // Carry the "Remember me" choice through the email-confirmation link
            // so the callback can stamp the right session length (4wk vs 3d).
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}&remember=${remember ? 1 : 0}`,
          },
        });
        if (error) throw error;
        // The signup agreement covers cookies — record the acceptance.
        try {
          localStorage.setItem("dailyos-cookie-consent", "accepted");
        } catch {
          /* ignore */
        }
        // If email confirmation is enabled there is no active session yet.
        if (!data.session) {
          setSentConfirmation(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailVal,
          password: passwordVal,
        });
        if (error) throw error;

        if (REQUIRE_OTP) {
          // Password is correct — but grant NO access on password alone. Discard
          // the session, then email a one-time code that must be entered to
          // actually create the session.
          await supabase.auth.signOut();
          const { error: otpErr } = await supabase.auth.signInWithOtp({
            email: emailVal,
            options: { shouldCreateUser: false },
          });
          if (otpErr) throw otpErr;
          setOtpEmail(emailVal);
          setOtpStage(true);
          setResendIn(30);
          setLoading(false);
          return;
        }
      }

      // Stamp how long this session lasts, honouring the "Remember me" tick on
      // both login and signup (ticked → 4 weeks, unticked → 3 days).
      markSessionStart(remember);

      toast({ variant: "success", title: "Welcome to DailyOS" });
      // One clean, hard navigation: the browser makes a single request that
      // runs middleware once and picks up the fresh auth cookie. This avoids
      // the slow router.push()+refresh() double server round-trip after login.
      window.location.assign(redirect);
      return; // keep the spinner up while the next page loads
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function verifyOtpCode(e: React.FormEvent) {
    e.preventDefault();
    const code = otpCode.trim();
    if (code.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: code,
        type: "email",
      });
      if (error) throw error;
      markSessionStart(remember);
      toast({ variant: "success", title: "Welcome to DailyOS" });
      window.location.assign(redirect);
      return; // keep the spinner up while the next page loads
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work — try again.");
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (resendIn > 0) return;
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: { shouldCreateUser: false },
    });
    if (error) setError(error.message);
    else {
      setResendIn(30);
      toast({ variant: "info", title: "New code sent" });
    }
  }

  if (otpStage) {
    return (
      <form onSubmit={verifyOtpCode} className="space-y-4">
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-semibold">Verify it&apos;s you</h2>
          <p className="text-sm text-muted-foreground">
            We emailed a 6-digit code to <strong>{otpEmail}</strong>. Enter it to
            finish signing in.
          </p>
        </div>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="123456"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
          className="text-center text-lg tracking-[0.5em]"
          autoFocus
          required
        />
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Verify &amp; sign in
        </Button>
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setOtpStage(false);
              setOtpCode("");
              setError(null);
              setLoading(false);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={resendOtp}
            disabled={resendIn > 0}
            className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  if (sentConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then come back and log in.
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" autoComplete="on">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          // "username" pairs with "current-password" so password managers offer
          // to fill a saved login (in the browser AND the installed PWA).
          autoComplete={mode === "login" ? "username" : "email"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {mode === "login" && (
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="size-4 shrink-0 accent-primary"
        />
        <span>Remember me</span>
      </label>

      {mode === "signup" && (
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setError(null);
            }}
            className="mt-0.5 size-4 shrink-0 accent-primary"
            aria-label="Agree to the Terms of Service and Privacy Policy"
          />
          <span>
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Terms
            </a>
            ,{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="/cookies"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Cookie Policy
            </a>
            , including the use of essential cookies.
          </span>
        </label>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || (mode === "signup" && !agreed)}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {mode === "signup" ? "Create account" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to DailyOS?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
