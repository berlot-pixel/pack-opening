"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export const EVENEMENT_RETOUR_ACCUEIL = "retour-accueil";

// Si on est déjà sur l'accueil, Next.js garde l'état de la page :
// on prévient l'ouvreur de pack pour qu'il revienne au booster fermé.
export function LienAccueil({ className, children }: { className?: string; children: ReactNode }) {
  const chemin = usePathname();

  return (
    <Link
      href="/"
      className={className}
      onClick={() => {
        if (chemin === "/") window.dispatchEvent(new Event(EVENEMENT_RETOUR_ACCUEIL));
      }}
    >
      {children}
    </Link>
  );
}
