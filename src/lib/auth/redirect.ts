/**
 * Mencegah open redirect: hanya izinkan path internal seperti "/account".
 * Menolak "https://...", "//evil.com", "/\evil.com", dan path berisi spasi.
 */
export function safeRedirectPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /\s/.test(value)) return fallback;
  return value;
}
