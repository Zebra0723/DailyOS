type AdminUser = { app_metadata?: unknown } | null | undefined;

/** Admin is authorization, so it must only come from server-controlled metadata. */
export function isAdminUser(user: AdminUser): boolean {
  return (
    (user?.app_metadata as { admin?: unknown } | undefined)?.admin === true
  );
}
