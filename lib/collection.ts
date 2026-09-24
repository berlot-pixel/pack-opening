import { useSyncExternalStore } from "react";
import { prixDeVente, type Carte } from "./cartes";

// Collection et coins sauvegardés dans le navigateur du joueur
export type Sauvegarde = {
  cartes: Record<number, number>;
  packs: number;
  coins: number;
  stock: number; // paquets disponibles au moment de majStock
  majStock: number; // date (en ms) à partir de laquelle on compte la recharge
};

// Jusqu'à 10 paquets en réserve, 1 paquet de plus toutes les 5 minutes
export const STOCK_MAX = 10;
export const DELAI_RECHARGE = 5 * 60 * 1000;

const CLE = "pack-opening:collection";
const EVENEMENT = "pack-opening:maj";
const VIDE: Sauvegarde = { cartes: {}, packs: 0, coins: 0, stock: STOCK_MAX, majStock: 0 };

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

// Heure actuelle en secondes, mise à jour chaque seconde (0 côté serveur)
function sAbonnerHorloge(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}
const secondeActuelle = () => Math.floor(Date.now() / 1000);

// Stock réel à un instant donné : on ajoute les paquets rechargés depuis majStock
function calculerStock({ stock, majStock }: Sauvegarde, maintenant: number) {
  if (stock >= STOCK_MAX) return { disponibles: STOCK_MAX, depuis: maintenant, attente: 0 };
  const recharges = Math.floor((maintenant - majStock) / DELAI_RECHARGE);
  const disponibles = Math.min(STOCK_MAX, stock + recharges);
  if (disponibles >= STOCK_MAX) return { disponibles, depuis: maintenant, attente: 0 };
  // On garde la progression vers le paquet suivant
  const depuis = majStock + recharges * DELAI_RECHARGE;
  return { disponibles, depuis, attente: depuis + DELAI_RECHARGE - maintenant };
}

// Paquets disponibles et millisecondes avant le prochain (attente = 0 si le stock est plein)
export function useStockPacks(): { disponibles: number; attente: number } {
  const sauvegarde = useCollection();
  const maintenant = useSyncExternalStore(sAbonnerHorloge, secondeActuelle, () => 0);
  if (!maintenant) return { disponibles: Math.min(sauvegarde.stock, STOCK_MAX), attente: 0 };
  const { disponibles, attente } = calculerStock(sauvegarde, maintenant * 1000);
  return { disponibles, attente };
}

export function packDisponible() {
  return calculerStock(lire(), Date.now()).disponibles > 0;
}

export function ajouterPack(pack: Carte[]) {
  const actuel = lire();
  const cartes = { ...actuel.cartes };
  for (const carte of pack) cartes[carte.id] = (cartes[carte.id] ?? 0) + 1;
  const { disponibles, depuis } = calculerStock(actuel, Date.now());
  enregistrer({
    ...actuel,
    cartes,
    packs: actuel.packs + 1,
    stock: Math.max(0, disponibles - 1),
    majStock: depuis,
  });
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
