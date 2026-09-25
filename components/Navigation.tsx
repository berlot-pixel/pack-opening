"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "@/lib/collection";
import { useCompte } from "@/lib/compte";
import { LienAccueil } from "./LienAccueil";

function IconePaquet() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 8 12 3 3 8v8l9 5 9-5Z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  );
}

function IconeCollection() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2Z" />
      <path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8Z" />
    </svg>
  );
}

function IconeAmis() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" />
    </svg>
  );
}

function IconeCompte() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

// Bas de la barre latérale : le joueur connecté, ou un bouton pour se connecter
function BlocCompte() {
  const { chargement, profil } = useCompte();
  if (chargement) return <div className="h-12 animate-pulse rounded-xl bg-white/5" />;
  if (!profil) {
    return (
      <Link
        href="/connexion"
        className="rounded-xl border border-accent/40 px-4 py-3 text-center text-sm font-semibold text-accent transition hover:bg-accent/10"
      >
        Se connecter
      </Link>
    );
  }
  return (
    <Link
      href="/connexion"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
      title="Mon compte"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent">
        {profil.pseudo[0].toUpperCase()}
      </span>
      <span className="truncate text-sm font-semibold">{profil.pseudo}</span>
    </Link>
  );
}

export function PieceCoin({ className = "size-4" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent font-display text-[9px] font-bold text-accent ${className}`}
      aria-hidden
    >
      P
    </span>
  );
}

export function Solde() {
  const { coins } = useCollection();
  return (
    <div
      className="flex items-center gap-1.5 text-sm font-semibold text-accent"
      title="Coins gagnés en revendant des cartes"
    >
      <PieceCoin />
      <span key={coins} className="solde-pop inline-block tabular-nums">
        {coins.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

const Logo = () => (
  <LienAccueil className="font-display text-2xl font-bold tracking-tight">
    <span className="text-accent">Pack</span>Opening
  </LienAccueil>
);

export function Navigation() {
  const chemin = usePathname();
  const liens = [
    { label: "Paquets", href: "/", icone: <IconePaquet /> },
    { label: "Collection", href: "/collection", icone: <IconeCollection /> },
    { label: "Amis", href: "/amis", icone: <IconeAmis /> },
    { label: "Compte", href: "/connexion", icone: <IconeCompte />, telephoneSeulement: true },
  ];

  return (
    <>
      {/* Ordinateur : barre latérale */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-8 border-r border-bordure bg-panneau px-4 py-7 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {liens.filter((lien) => !lien.telephoneSeulement).map((lien) => {
            const actif = chemin === lien.href;
            const classes = `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              actif ? "bg-accent/10 text-accent" : "text-white/75 hover:bg-white/5 hover:text-white"
            }`;
            const contenu = (
              <>
                {lien.icone}
                <span className="flex-1">{lien.label}</span>
                {actif && <span className="size-1.5 rounded-full bg-accent" />}
              </>
            );
            return lien.href === "/" ? (
              <LienAccueil key={lien.href} className={classes}>
                {contenu}
              </LienAccueil>
            ) : (
              <Link key={lien.href} href={lien.href} className={classes}>
                {contenu}
              </Link>
            );
          })}
        </nav>
        <BlocCompte />
      </aside>

      {/* Téléphone : barre du haut */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-bordure bg-panneau/95 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <div className="flex items-center gap-1">
          {liens.map((lien) => {
            const actif = chemin === lien.href;
            const classes = `rounded-lg p-2 transition ${actif ? "bg-accent/10 text-accent" : "text-white/70"}`;
            return lien.href === "/" ? (
              <LienAccueil key={lien.href} className={classes}>
                {lien.icone}
                <span className="sr-only">{lien.label}</span>
              </LienAccueil>
            ) : (
              <Link key={lien.href} href={lien.href} className={classes}>
                {lien.icone}
                <span className="sr-only">{lien.label}</span>
              </Link>
            );
          })}
          <div className="ml-2">
            <Solde />
          </div>
        </div>
      </header>
    </>
  );
}
