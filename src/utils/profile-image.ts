/** True when URL is suitable for public/featured profile display (not empty, not placeholder). */
export function hasPublicProfileImage(url: string | null | undefined): boolean {
  const raw = String(url ?? "").trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  if (lower.includes("placeholder.svg")) return false;
  if (lower.includes("text=org") || lower.includes("text=avatar")) return false;
  return true;
}
