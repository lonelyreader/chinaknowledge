import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif } from "next/font/google";
import { validateServerEnvironment } from "@/config/environment";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const { indexable } = validateServerEnvironment();

export const metadata: Metadata = {
  title: { default: "China, in Fact", template: "%s | China, in Fact" },
  description: "Stories, guides, places and people from China, edited for international readers.",
  robots: indexable
    ? { follow: true, index: true }
    : { follow: false, index: false, nocache: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
