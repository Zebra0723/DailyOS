"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

export async function deleteObjectAction(
  bucket: string,
  path: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createServiceClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Returns a shareable URL: public URL for public buckets, else a 1-hour
 *  signed URL. */
export async function getObjectUrlAction(
  bucket: string,
  path: string,
  isPublic: boolean,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  await requireAdminUser();
  const admin = createServiceClient();
  try {
    if (isPublic) {
      const { data } = admin.storage.from(bucket).getPublicUrl(path);
      return { ok: true, url: data.publicUrl };
    }
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 3600);
    if (error) return { ok: false, error: error.message };
    return { ok: true, url: data.signedUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
