"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/content";
import { ui } from "@/content";
import { Wordmark } from "@/components/wordmark";

const sharedLanguageRoutes = new Set(["about", "guides", "newsletter", "people", "places", "privacy", "stories"]);
const sharedPurposeRoutes = new Set(["business", "live", "study", "understand", "visit", "work"]);

function sharedLanguageHref(pathname: string, targetLocale: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "en" && parts[0] !== "es") return null;
  if (parts.length === 1) return `/${targetLocale}`;
  if (parts.length === 2 && sharedLanguageRoutes.has(parts[1])) return `/${targetLocale}/${parts[1]}`;
  if (parts.length === 3 && parts[1] === "purposes" && sharedPurposeRoutes.has(parts[2])) {
    return `/${targetLocale}/purposes/${parts[2]}`;
  }
  return null;
}

export function SiteHeader({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [languageHrefs, setLanguageHrefs] = useState<Partial<Record<Locale, string>>>({ [locale]: pathname });
  const copy = ui[locale];
  const navHrefs = ["people", "stories", "guides", "places"];

  useEffect(() => {
    const readAlternates = () => {
      const entries = (["en", "es"] as const).flatMap((targetLocale) => {
        const alternate = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${targetLocale}"]`);
        const href = alternate?.getAttribute("href")
          || sharedLanguageHref(pathname, targetLocale)
          || (targetLocale === locale ? pathname : null);
        return href ? [[targetLocale, href] as const] : [];
      });
      setLanguageHrefs(Object.fromEntries(entries) as Partial<Record<Locale, string>>);
    };
    readAlternates();
    const observer = new MutationObserver(readAlternates);
    observer.observe(document.head, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  const availableLanguages = (["en", "es"] as const).filter((targetLocale) => languageHrefs[targetLocale]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="wordmark" href={`/${locale}`} onClick={() => setOpen(false)}>
          <Wordmark priority />
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
            {availableLanguages.map((targetLocale, index) => (
              <span key={targetLocale}>
                {index ? <span aria-hidden="true">/</span> : null}
                <Link className={locale === targetLocale ? "is-active" : ""} href={languageHrefs[targetLocale]!}>{targetLocale.toUpperCase()}</Link>
              </span>
            ))}
          </div>
          <a className="button button--compact desktop-subscribe" href="https://discord.gg/CCUbfaRVd2" rel="noreferrer" target="_blank">
            {copy.subscribe}
          </a>
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
        <a className="button" href="https://discord.gg/CCUbfaRVd2" rel="noreferrer" target="_blank" onClick={() => setOpen(false)}>
          {copy.subscribe}
        </a>
      </nav>
    </header>
  );
}
