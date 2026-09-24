import { useSyncExternalStore } from "react";
import type { Carte } from "./cartes";

// Collection sauvegardée dans le navigateur du joueur
export type Sauvegarde = { cartes: Record<number, number>; packs: number };

const CLE = "pack-opening:collection";
const EVENEMENT = "pack-opening:maj";
const VIDE: Sauvegarde = { cartes: {}, packs: 0 };

let etat: Sauvegarde | null = null;

function lire(): Sauvegarde {
  if (etat === null) {
    try {
      const brut = localStorage.getItem(CLE);
      etat = brut ? { ...VIDE, ...JSON.parse(brut) } : VIDE;
    } catch {
      etat = VIDE;
    }
  }
  return etat!;
}

function sAbonner(callback: () => void) {
  const surStockage = () => {
    etat = null;
    callback();
  };
  window.addEventListener(EVENEMENT, callback);
  window.addEventListener("storage", surStockage);
  return () => {
    window.removeEventListener(EVENEMENT, callback);
    window.removeEventListener("storage", surStockage);
  };
}

export function useCollection(): Sauvegarde {
  return useSyncExternalStore(sAbonner, lire, () => VIDE);
}

export function ajouterPack(pack: Carte[]) {
  const actuel = lire();
  const cartes = { ...actuel.cartes };
  for (const carte of pack) cartes[carte.id] = (cartes[carte.id] ?? 0) + 1;
  etat = { cartes, packs: actuel.packs + 1 };
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // stockage indisponible : la collection reste en mémoire pour cette visite
  }
  window.dispatchEvent(new Event(EVENEMENT));
}
