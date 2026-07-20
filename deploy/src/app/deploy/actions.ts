"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import {
  triggerDeploy,
  cancelDeployment,
  promoteDeployment,
  redeployDeployment,
  createEnv,
  updateEnv,
  deleteEnv,
} from "@/lib/vercel";

type R = { ok: boolean; error?: string };

export async function triggerDeployAction(): Promise<R> {
  await requireAdminUser();
  return triggerDeploy();
}

export async function cancelDeploymentAction(id: string): Promise<R> {
  await requireAdminUser();
  const r = await cancelDeployment(id);
  if (r.ok) revalidatePath("/deploy");
  return r;
}

export async function promoteDeploymentAction(id: string): Promise<R> {
  await requireAdminUser();
  const r = await promoteDeployment(id);
  if (r.ok) revalidatePath("/deploy");
  return r;
}

export async function redeployDeploymentAction(
  id: string,
  name: string,
  target: string | null,
): Promise<R> {
  await requireAdminUser();
  const r = await redeployDeployment(id, name, target);
  if (r.ok) revalidatePath("/deploy");
  return r;
}

export async function createEnvAction(input: {
  key: string;
  value: string;
  type: string;
  target: string[];
}): Promise<R> {
  await requireAdminUser();
  const r = await createEnv(input);
  if (r.ok) revalidatePath("/deploy/env");
  return r;
}

export async function updateEnvAction(
  envId: string,
  input: { value?: string; target?: string[]; type?: string },
): Promise<R> {
  await requireAdminUser();
  const r = await updateEnv(envId, input);
  if (r.ok) revalidatePath("/deploy/env");
  return r;
}

export async function deleteEnvAction(envId: string): Promise<R> {
  await requireAdminUser();
  const r = await deleteEnv(envId);
  if (r.ok) revalidatePath("/deploy/env");
  return r;
}
