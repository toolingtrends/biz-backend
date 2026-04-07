import prisma from "../config/prisma";
import type { Prisma } from "@prisma/client";

export async function getAppSettingJson<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.adminAppSetting.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  try {
    return row.value as T;
  } catch {
    return fallback;
  }
}

export async function setAppSettingJson(key: string, value: Prisma.InputJsonValue): Promise<void> {
  await prisma.adminAppSetting.upsert({
    where: { key },
    create: { key, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue },
  });
}

export async function mergeAppSettingJson<T extends Record<string, unknown>>(
  key: string,
  patch: Partial<T>,
  fallback: T,
): Promise<T> {
  const current = await getAppSettingJson<T>(key, fallback);
  const next = { ...current, ...patch } as T;
  await setAppSettingJson(key, next as unknown as Prisma.InputJsonValue);
  return next;
}
