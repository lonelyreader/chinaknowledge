"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  activeQuery?: { key: string; value: string };
  children: ReactNode;
  href: string;
};

export function AdminNavLink({ activeQuery, children, href }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetPath = href.split("?", 1)[0];
  const active = pathname === targetPath && (!activeQuery || searchParams.get(activeQuery.key) === activeQuery.value);

  return (
    <Link aria-current={active ? "page" : undefined} className={active ? "admin-nav-link--active" : undefined} href={href}>
      {children}
    </Link>
  );
}
