export function siteMediaSource(value: string) {
  try {
    const url = new URL(value, "https://chinainfact.com");
    if (url.pathname.startsWith("/api/media/file/")) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    return value;
  }
  return value;
}
