import { useSyncExternalStore } from "react";
import { prixDeVente, type Carte } from "./cartes";

// Collection et coins sauvegardés dans le navigateur du joueur
export type Sauvegarde = { cartes: Record<number, number>; packs: number; coins: number };

const CLE = "pack-opening:collection";
const EVENEMENT = "pack-opening:maj";
const VIDE: Sauvegarde = { cartes: {}, packs: 0, coins: 0 };

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

function enregistrer(nouvel: Sauvegarde) {
  etat = nouvel;
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // stockage indisponible : la collection reste en mémoire pour cette visite
  }
  window.dispatchEvent(new Event(EVENEMENT));
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
  enregistrer({ ...actuel, cartes, packs: actuel.packs + 1 });
}

// Vend un exemplaire de la carte (si c'était le dernier, elle quitte la collection)
export function vendreCarte(carte: Carte) {
  const actuel = lire();
  const nombre = actuel.cartes[carte.id] ?? 0;
  if (nombre === 0) return;
  const cartes = { ...actuel.cartes };
  if (nombre === 1) delete cartes[carte.id];
  else cartes[carte.id] = nombre - 1;
  enregistrer({ ...actuel, cartes, coins: actuel.coins + prixDeVente(carte) });
}

// Coins rapportés en vendant tous les doublons (on garde 1 exemplaire de chaque carte)
export function gainDoublons(toutes: Carte[], possedees: Record<number, number>) {
  return toutes.reduce((total, carte) => {
    const enTrop = (possedees[carte.id] ?? 0) - 1;
    return enTrop > 0 ? total + enTrop * prixDeVente(carte) : total;
  }, 0);
}

export function vendreDoublons(toutes: Carte[]) {
  const actuel = lire();
  const gain = gainDoublons(toutes, actuel.cartes);
  if (gain === 0) return;
  const cartes = { ...actuel.cartes };
  for (const carte of toutes) if ((cartes[carte.id] ?? 0) > 1) cartes[carte.id] = 1;
  enregistrer({ ...actuel, cartes, coins: actuel.coins + gain });
}
