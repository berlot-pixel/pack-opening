import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-white/10 bg-black/30 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-black tracking-tight">
              🏠 Pack<span className="text-yellow-300">Opening</span>
            </Link>
            <div className="flex gap-1 text-sm">
              <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10">
                Ouvrir
              </Link>
              <Link href="/collection" className="rounded-full px-4 py-2 transition hover:bg-white/10">
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
