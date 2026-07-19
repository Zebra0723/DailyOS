"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";
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
  const [magicSent, setMagicSent] = React.useState(false);
  const [magicLoading, setMagicLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentConfirmation, setSentConfirmation] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  // Off by default: a plain login lasts 30 days; ticking it stretches to 1 year.
  const [remember, setRemember] = React.useState(false);
  // Code entry: the emailed link opens in the browser, not the installed app,
  // so we also let people type the 6-digit code straight into the app (verifies
  // in this context, so the PWA actually gets signed in).
  const [code, setCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);

  // New sign-ups go through onboarding; logins land on the welcome screen.
  // A `redirect` param (e.g. from a protected page) takes priority — but only if
  // it's a same-origin path ("/…"), never an absolute/protocol-relative URL, so
  // a crafted ?redirect=https://evil.com can't bounce you off-site after login.
  const safe =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const redirect = safe || (mode === "signup" ? "/onboarding" : "/welcome");

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

  // Passwordless sign-in: email a one-tap magic link. Great when password
  // autofill won't cooperate — no password to type or fill at all.
  async function sendMagicLink() {
    const emailVal = (emailRef.current?.value || email).trim();
    if (!emailVal) {
      setError("Enter your email first, then tap the link button.");
      return;
    }
    setError(null);
    setMagicLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailVal,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}&remember=1`,
        },
      });
      if (error) throw error;
      setEmail(emailVal);
      setMagicSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link.");
    } finally {
      setMagicLoading(false);
    }
  }

  // Verify the 6-digit code from the email IN THIS APP. This is what makes
  // sign-in work in the installed PWA, where the emailed link would otherwise
  // open in the browser and never reach the app.
  async function verifyCode() {
    const token = code.replace(/\s/g, "");
    if (token.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) throw error;
      markSessionStart(remember);
      window.location.assign(redirect);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That code didn't work — check it and try again.",
      );
      setVerifying(false);
    }
  }

  if (magicSent) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Mail className="size-6" />
          </div>
          <h2 className="mt-3 text-lg font-semibold">Check your email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a sign-in code to <strong>{email}</strong>. Enter the 6-digit
            code below — that works even in the installed app.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="otp">6-digit code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            className="text-center text-lg tracking-[0.4em]"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={verifyCode} disabled={verifying}>
          {verifying ? <Loader2 className="size-4 animate-spin" /> : null}
          Verify &amp; sign in
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Or tap the link in the email if you&apos;re in a browser.
        </p>
        <Button variant="ghost" className="w-full" onClick={() => { setMagicSent(false); setCode(""); }}>
          Back to log in
        </Button>
      </div>
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

      {mode === "login" && (
        <>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={sendMagicLink}
            disabled={magicLoading || loading}
          >
            {magicLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            Email me a sign-in link (no password)
          </Button>
        </>
      )}

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
