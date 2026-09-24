import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import { LienAccueil } from "@/components/LienAccueil";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pack Opening — Objets de la maison",
  description: "Ouvre des boosters et collectionne les objets du quotidien, de Commune à Ultra rare.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-or/15 bg-black/40 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <LienAccueil className="font-serif text-2xl tracking-wide text-ivoire">
              Pack <span className="text-or italic">Opening</span>
            </LienAccueil>
            <div className="flex gap-1 text-[11px] tracking-[0.25em] uppercase">
              <LienAccueil className="px-3 py-2 text-white/60 transition hover:text-or-clair">
                Ouvrir
              </LienAccueil>
              <Link href="/collection" className="px-3 py-2 text-white/60 transition hover:text-or-clair">
                Collection
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
