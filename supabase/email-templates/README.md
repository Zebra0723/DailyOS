# DailyOS auth emails — send from DailyOS, branded

By default Supabase sends auth emails (confirm signup, reset password, magic
link) from its own address (`noreply@mail.app.supabase.io`) with a plain design
and a low rate limit. To make them come from **DailyOS**, do two things.

## 1. Send from your own domain (Custom SMTP)

This changes the **From** address. Use Resend (already used for reward emails).

1. In **Resend** → Domains, add and verify your sending domain (e.g.
   `dailyos.app`) by adding the SPF/DKIM DNS records it gives you.
2. In **Supabase** → Project Settings → **Authentication** → **SMTP Settings**,
   turn on **Custom SMTP** and enter:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (STARTTLS)
   - Username: `resend`
   - Password: your **Resend API key** (`re_…`)
   - Sender email: `DailyOS <hello@dailyos.app>` (a verified address)
3. Also set **Site URL** (Authentication → URL Configuration) to your live URL
   — this makes the links in the emails point at the real site, not localhost.

After this, all auth emails come **from DailyOS**.

## 2. Brand the emails (templates)

In **Supabase** → Authentication → **Email Templates**, paste each file here into
the matching template and Save:

| Supabase template | File |
| --- | --- |
| Reset Password | `reset-password.html` |
| Magic Link | `magic-link.html` |
| Confirm signup | `confirm-signup.html` |

Supabase fills `{{ .ConfirmationURL }}` with the real link when it sends.
(There are also "Change Email Address", "Invite user" and "Reauthentication"
templates you can brand the same way using the same look.)

## Fully custom (advanced, optional)

For total control — sending the emails from DailyOS's own code (like the reward
emails in `src/lib/email.ts`) — Supabase supports a **Send Email Hook**
(Authentication → Hooks). It calls a webhook/Edge Function you write for every
auth email, so you render and send the HTML yourself via Resend. More work than
the two steps above, but 100% custom. The steps above cover the vast majority of
cases.
