"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/content";
import { ui } from "@/content";

function localePath(pathname: string, locale: Locale) {
  const parts = pathname.split("/");
  parts[1] = locale;
  return parts.join("/") || `/${locale}`;
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [languageHrefs, setLanguageHrefs] = useState<Record<Locale, string> | null>(null);
  const pathname = usePathname();
  const copy = ui[locale];
  const navHrefs = ["stories", "guides", "places", "people"];

  useEffect(() => {
    const readAlternates = () => {
      const entries = (["en", "es"] as const).map((targetLocale) => {
        const alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${targetLocale}"]`);
        return [targetLocale, alternate?.getAttribute("href") || localePath(pathname, targetLocale)] as const;
      });
      setLanguageHrefs(Object.fromEntries(entries) as Record<Locale, string>);
    };
    readAlternates();
    const observer = new MutationObserver(readAlternates);
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" href={`/${locale}`} onClick={() => setOpen(false)}>
          China, in Fact
        </Link>
        <nav className="desktop-nav" aria-label={locale === "en" ? "Primary" : "Principal"}>
          {copy.nav.map((item, index) => (
            <Link key={item} href={`/${locale}/${navHrefs[index]}`}>
              {item}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <div className="language-switch" aria-label={locale === "en" ? "Language" : "Idioma"}>
            <Link className={locale === "en" ? "is-active" : ""} href={languageHrefs?.en ?? localePath(pathname, "en")}>EN</Link>
            <span aria-hidden="true">/</span>
            <Link className={locale === "es" ? "is-active" : ""} href={languageHrefs?.es ?? localePath(pathname, "es")}>ES</Link>
          </div>
          <Link className="button button--compact desktop-subscribe" href={`/${locale}/newsletter`}>
            {copy.subscribe}
          </Link>
          <button
            className="menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? copy.close : copy.menu}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <nav id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} aria-label={locale === "en" ? "Mobile primary" : "Principal móvil"}>
        {copy.nav.map((item, index) => (
          <Link key={item} href={`/${locale}/${navHrefs[index]}`} onClick={() => setOpen(false)}>
            {item}
          </Link>
        ))}
        <Link className="button" href={`/${locale}/newsletter`} onClick={() => setOpen(false)}>
          {copy.subscribe}
        </Link>
      </nav>
    </header>
  );
}
