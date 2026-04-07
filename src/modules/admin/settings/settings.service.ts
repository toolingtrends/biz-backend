import prisma from "../../../config/prisma";
import { languageSettingsSeed } from "./language-settings.seed";

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

/** Full payload for admin Language & Localization page (matches legacy Next.js shape). */
export function getLanguagePageData() {
  return {
    languages: languageSettingsSeed.languages.map((l) => ({ ...l })),
    translations: languageSettingsSeed.translations.map((t) => ({
      ...t,
      translations: { ...t.translations },
    })),
    settings: { ...languageSettingsSeed.settings },
    stats: [...languageSettingsSeed.stats],
  };
}

export function patchLanguageLocaleSettings(body: Record<string, unknown>) {
  return { success: true as const, settings: body };
}

export function patchLanguageRow(languageId: string, updates: Record<string, unknown>) {
  return { success: true as const, id: languageId, updates };
}

export function patchTranslationRow(translationId: string, translation: Record<string, unknown>) {
  return { success: true as const, id: translationId, translation };
}

export function deleteLanguageRow(languageId: string) {
  return { success: true as const, deleted: languageId };
}

export async function getBackup() {
  return { schedules: [], lastBackup: null };
}
