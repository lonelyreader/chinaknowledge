export const roles = ["author", "editor", "super_admin"] as const;

export type Role = (typeof roles)[number];

export type CMSUser = {
  id: number | string;
  role?: Role | null;
};

export function isCMSUser(value: unknown): value is CMSUser {
  if (!value || typeof value !== "object") return false;
  return "id" in value;
}

export function hasEditorialRole(user: CMSUser | null | undefined) {
  return user?.role === "editor" || user?.role === "super_admin";
}

export function isSuperAdmin(user: CMSUser | null | undefined) {
  return user?.role === "super_admin";
}
