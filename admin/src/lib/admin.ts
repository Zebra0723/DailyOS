// The ONLY emails allowed into the admin backend. Add/remove here (no env var
// needed). Everyone else is refused.
export const ADMIN_EMAILS: string[] = [
  "arjunvirjain@icloud.com",
  "leonardo.mcnicol@icloud.com",
].map((e) => e.toLowerCase());

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
