import { SiteHeader } from "@/components/site-header";
import { locales, requireLocale, ui } from "@/content";
import Link from "next/link";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const locale = requireLocale((await params).locale);
  const copy = ui[locale];

  return (
    <div lang={locale}>
      <SiteHeader locale={locale} />
      {children}
      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="wordmark">China, in Fact</p>
          <nav aria-label="Footer">
            <Link href={`/${locale}/stories`}>{copy.nav[0]}</Link>
            <Link href={`/${locale}/guides`}>{copy.nav[1]}</Link>
            <Link href={`/${locale}/places`}>{copy.nav[2]}</Link>
            <Link href={`/${locale}/people`}>{copy.nav[3]}</Link>
          </nav>
          <p className="meta">© 2026</p>
        </div>
      </footer>
    </div>
  );
}
