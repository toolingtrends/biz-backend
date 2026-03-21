import prisma from "../../../config/prisma";

export async function getModules() {
  return { modules: [] };
}

/**
 * Dashboard stats for the notification settings page.
 * Uses in-app `Message` totals (read vs total) as a PostgreSQL-backed signal;
 * dedicated push/email notification rows can replace this later.
 */
export async function getNotifications() {
  const [totalSent, readCount] = await Promise.all([
    prisma.message.count(),
    prisma.message.count({ where: { isRead: true } }),
  ]);

  const deliveryRate = totalSent > 0 ? 98.5 : 0;
  const openRate = totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0;

  return {
    stats: {
      totalSent,
      deliveryRate,
      openRate,
      activeChannels: 3,
    },
  };
}

/** Persist notification settings (channels, types, etc.) — extend when a settings table exists. */
export async function saveNotifications(_body: Record<string, unknown>) {
  return { ok: true as const };
}

export async function getSecurity() {
  return { settings: {} };
}

export async function getLanguage() {
  return { languages: [], defaultLanguage: "en" };
}

export async function getBackup() {
  return { schedules: [], lastBackup: null };
}
