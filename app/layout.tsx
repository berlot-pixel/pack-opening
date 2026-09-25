import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Navigation, Solde } from "@/components/Navigation";
import { FournisseurCompte } from "@/lib/compte";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
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
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <FournisseurCompte>
          <Navigation />
          <div className="md:pl-60">
            <div className="hidden justify-end px-6 pt-5 md:flex">
              <Solde />
            </div>
            <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-4">{children}</main>
          </div>
        </FournisseurCompte>
      </body>
    </html>
  );
}
