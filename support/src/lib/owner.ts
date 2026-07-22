// Owner detection. The OWNER is the single admin who can approve, edit, or
// decline replies drafted by other admins (e.g. Leo). Their own replies send
// immediately. Everyone else in ADMIN_EMAILS is a helper whose replies queue.

export const OWNER_EMAIL = (
  process.env.OWNER_EMAIL || "arjunvirjain@icloud.com"
).toLowerCase();

export function isOwner(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === OWNER_EMAIL;
}
