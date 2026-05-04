/** Normalize venue timezone from API input: empty clears; invalid omits update (undefined). */
export function normalizeVenueTimezoneInput(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined
  const s = String(raw ?? "").trim()
  if (!s) return null
  try {
    const allowed = new Set(Intl.supportedValuesOf("timeZone") as string[])
    if (allowed.has(s)) return s
  } catch {
    if (s === "UTC") return "UTC"
  }
  return undefined
}
