import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { Wordmark } from "@/components/wordmark";
import { validateServerEnvironment } from "@/config/environment";
import { locales, requireLocale, ui } from "@/content";
import Link from "next/link";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const { indexable } = validateServerEnvironment();
const publicOrigin = (process.env.PAYLOAD_PUBLIC_SERVER_URL || "https://chinainfact.com").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: { default: "China, in Fact", template: "%s | China, in Fact" },
  description: "Meet people in China through their work, interests and contributions.",
  robots: indexable
    ? { follow: true, index: true }
    : { follow: false, index: false, nocache: true },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const locale = requireLocale((await params).locale);
  const copy = ui[locale];

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable}`}>
      <body>
        <SiteHeader locale={locale} />
        {children}
        <footer className="site-footer">
          <div className="site-footer__inner">
            <p className="wordmark"><Wordmark /></p>
            <nav aria-label="Footer">
              <Link href={`/${locale}/people`}>{copy.nav[0]}</Link>
              <Link href={`/${locale}/stories`}>{copy.nav[1]}</Link>
              <Link href={`/${locale}/guides`}>{copy.nav[2]}</Link>
              <Link href={`/${locale}/places`}>{copy.nav[3]}</Link>
              <Link href={`/${locale}/about`}>{locale === "en" ? "About" : "Acerca de"}</Link>
              <Link href={`/${locale}/privacy`}>{copy.privacy}</Link>
            </nav>
            <p className="meta">© 2026</p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
