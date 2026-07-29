import type { ServerProps } from "payload";

import type { Person, User } from "@/payload-types";
import { AdminNavLink } from "./AdminNavLink";

export async function AdminNavLinks({ payload, user: untypedUser }: ServerProps) {
  const user = untypedUser as User | undefined;
  if (!user) return null;

  const editorial = user?.role === "editor" || user?.role === "super_admin";
  const people = await payload.find({
    collection: "people",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { user: { equals: user.id } },
  });
  const person = people.docs[0] as Person | undefined;

  const myWork = `/admin/collections/articles?where[owner][equals]=${encodeURIComponent(String(user.id))}&where[title][exists]=true`;

  return (
    <nav aria-label="Work" className="admin-nav-links">
      {editorial ? <AdminNavLink href="/admin">Needs attention</AdminNavLink> : null}
      <AdminNavLink
        activeQuery={editorial ? { key: "where[owner][equals]", value: String(user.id) } : undefined}
        href={editorial ? myWork : "/admin"}
      >My work</AdminNavLink>
      {person ? <AdminNavLink href={`/admin/collections/people/${person.id}`}>My profile</AdminNavLink> : null}
    </nav>
  );
}
