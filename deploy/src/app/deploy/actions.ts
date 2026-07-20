"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { triggerDeploy } from "@/lib/vercel";

export async function triggerDeployAction(): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  return triggerDeploy();
}
