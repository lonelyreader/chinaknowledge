"use client";

import { useAuth } from "@payloadcms/ui";
import Link from "next/link";

import type { User } from "@/payload-types";

const superAdminLinks = [
  ["Members", "/admin/collections/users"],
  ["People", "/admin/collections/people"],
  ["Images", "/admin/collections/media"],
  ["Articles", "/admin/collections/articles"],
  ["Categories", "/admin/collections/taxonomies"],
  ["Places", "/admin/collections/places"],
  ["Activity", "/admin/collections/workflow-events"],
] as const;

export function AdminNav() {
  const { user } = useAuth<User>();
  const links = user?.role === "super_admin"
    ? superAdminLinks
    : user?.role === "editor"
      ? [["Articles", "/admin/collections/articles"]] as const
      : [];

  return (
    <nav className="admin-nav" aria-label="Workspace">
      <Link className="admin-nav__brand" href="/admin">China, in Fact</Link>
      <Link href="/admin">My work</Link>
      {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      <a className="admin-nav__logout" href="/admin/logout">Log out</a>
    </nav>
  );
}
