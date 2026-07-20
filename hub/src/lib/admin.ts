// The ONLY emails allowed into DailyOS Base. Everyone else is refused.
export const ADMIN_EMAILS: string[] = [
  "arjunvirjain@icloud.com",
  "leonardo.mcnicol@icloud.com",
].map((e) => e.toLowerCase());

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
