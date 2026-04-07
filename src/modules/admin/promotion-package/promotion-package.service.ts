import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { getAppSettingJson, setAppSettingJson } from "../../../lib/admin-app-setting";

function asJsonInput<T>(v: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

const KEY = "promotion_packages_catalog";

export interface PromotionPackageItem {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  userCount: number;
  duration: string;
  durationDays: number;
  categories: string[];
  recommended: boolean;
  isActive: boolean;
  userType: string;
  order: number;
}

function defaultPackages(): PromotionPackageItem[] {
  return [
    {
      id: "pkg_featured_home",
      name: "Featured on Homepage",
      description: "Premium placement on the main discovery feed.",
      price: 299,
      features: ["7-day placement", "Highlighted card", "Priority in search"],
      userCount: 0,
      duration: "7 days",
      durationDays: 7,
      categories: [],
      recommended: true,
      isActive: true,
      userType: "BOTH",
      order: 1,
    },
    {
      id: "pkg_event_boost",
      name: "Event Boost",
      description: "Increased visibility for a single event.",
      price: 149,
      features: ["14-day boost", "Email mention", "Social snippet"],
      userCount: 0,
      duration: "14 days",
      durationDays: 14,
      categories: [],
      recommended: false,
      isActive: true,
      userType: "ORGANIZER",
      order: 2,
    },
    {
      id: "pkg_exhibitor_spotlight",
      name: "Exhibitor Spotlight",
      description: "Dedicated exhibitor promotion slot.",
      price: 199,
      features: ["Booth map pin", "Lead form CTA"],
      userCount: 0,
      duration: "10 days",
      durationDays: 10,
      categories: [],
      recommended: false,
      isActive: true,
      userType: "EXHIBITOR",
      order: 3,
    },
  ];
}

async function loadPackages(): Promise<PromotionPackageItem[]> {
  let list = await getAppSettingJson<PromotionPackageItem[] | null>(KEY, null);
  if (!list || !Array.isArray(list) || list.length === 0) {
    list = defaultPackages();
    await setAppSettingJson(KEY, asJsonInput(list));
  }
  return list;
}

async function savePackages(list: PromotionPackageItem[]) {
  await setAppSettingJson(KEY, asJsonInput(list));
}

export async function listPromotionPackages(): Promise<PromotionPackageItem[]> {
  const list = await loadPackages();
  return [...list].sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
}

export async function createPromotionPackage(input: Partial<PromotionPackageItem>): Promise<PromotionPackageItem> {
  const list = await loadPackages();
  const item: PromotionPackageItem = {
    id: randomUUID(),
    name: String(input.name ?? "").trim(),
    description: String(input.description ?? "").trim(),
    price: Number(input.price ?? 0),
    features: Array.isArray(input.features) ? input.features.map(String) : [],
    userCount: Number(input.userCount ?? 0),
    duration: String(input.duration ?? ""),
    durationDays: Number(input.durationDays ?? 0),
    categories: Array.isArray(input.categories) ? input.categories.map(String) : [],
    recommended: !!input.recommended,
    isActive: input.isActive !== false,
    userType: String(input.userType ?? "BOTH"),
    order: Number(input.order ?? list.length),
  };
  list.push(item);
  await savePackages(list);
  return item;
}

export async function updatePromotionPackage(
  id: string,
  input: Partial<PromotionPackageItem>,
): Promise<PromotionPackageItem | null> {
  const list = await loadPackages();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const current = list[idx];
  const updated: PromotionPackageItem = {
    ...current,
    ...input,
    id: current.id,
    price: input.price !== undefined ? Number(input.price) : current.price,
    userCount: input.userCount !== undefined ? Number(input.userCount) : current.userCount,
    durationDays: input.durationDays !== undefined ? Number(input.durationDays) : current.durationDays,
    features:
      input.features !== undefined ? (Array.isArray(input.features) ? input.features.map(String) : []) : current.features,
    categories:
      input.categories !== undefined ? (Array.isArray(input.categories) ? input.categories.map(String) : []) : current.categories,
  };
  list[idx] = updated;
  await savePackages(list);
  return updated;
}

export async function deletePromotionPackage(id: string): Promise<boolean> {
  const list = await loadPackages();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  list.splice(idx, 1);
  await savePackages(list);
  return true;
}
