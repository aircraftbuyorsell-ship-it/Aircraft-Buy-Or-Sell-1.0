export function sanitizePrimaryImageUrl(
  value: string | null | undefined,
  approvedHosts: readonly string[],
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const normalizedHosts = new Set(approvedHosts.map((host) => host.trim().toLowerCase()).filter(Boolean));
    if (!normalizedHosts.has(url.hostname.toLowerCase())) return null;
    return url.href;
  } catch {
    return null;
  }
}
