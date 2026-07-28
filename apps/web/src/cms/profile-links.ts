export function isValidEmailProfileLink(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "mailto:") return false;
    const recipient = decodeURIComponent(url.pathname).trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  } catch {
    return false;
  }
}

export function isValidWebProfileLink(value: string) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
