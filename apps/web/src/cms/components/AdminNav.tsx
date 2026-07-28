"use client";

import { useAuth } from "@payloadcms/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { User } from "@/payload-types";

const superAdminLinks = [
  ["Members", "/admin/collections/users"],
  ["People", "/admin/collections/people"],
  ["Images", "/admin/collections/media"],
  ["All articles", "/admin/collections/articles"],
  ["Categories", "/admin/collections/taxonomies"],
  ["Places", "/admin/collections/places"],
  ["Activity", "/admin/collections/workflow-events"],
] as const;

export function AdminNav() {
  const { user } = useAuth<User>();
  const [personID, setPersonID] = useState<number | string | null>(null);
  const editorial = user?.role === "editor" || user?.role === "super_admin";
  const links = user?.role === "super_admin"
    ? superAdminLinks
    : user?.role === "editor"
      ? [["All articles", "/admin/collections/articles"]] as const
      : [];

  useEffect(() => {
    if (!user?.id) return;
    let current = true;
    fetch(`/api/people?where[user][equals]=${encodeURIComponent(String(user.id))}&depth=0&limit=1`, { credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (current && result?.docs?.[0]?.id) setPersonID(result.docs[0].id);
      })
      .catch(() => undefined);
    return () => { current = false; };
  }, [user?.id]);

  const myWork = user?.id
    ? `/admin/collections/articles?where[owner][equals]=${encodeURIComponent(String(user.id))}`
    : "/admin";

  return (
    <nav className="admin-nav" aria-label="Workspace">
      <Link className="admin-nav__brand" href="/admin">China, in Fact</Link>
      {editorial ? <Link href="/admin">Needs attention</Link> : null}
      <Link href={editorial ? myWork : "/admin"}>My work</Link>
      {personID ? <Link href={`/admin/collections/people/${personID}`}>My profile</Link> : null}
      {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      <Link className="admin-nav__logout" href="/admin/logout">Log out</Link>
    </nav>
  );
}
