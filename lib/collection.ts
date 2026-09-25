import { useSyncExternalStore } from "react";
import { prixDeVente, type Carte } from "./cartes";
import { supabase } from "./supabase";
import { estCarteWiki } from "./wikipedia";

// Collection, coins et stock de paquets.
// Sans compte : sauvegardés dans le navigateur. Avec un compte : enregistrés dans Supabase
// (le navigateur garde une copie pour un affichage immédiat).
export type Sauvegarde = {
  cartes: Record<number, number>;
  packs: number;
  coins: number;
  stock: number; // paquets disponibles au moment de majStock
  majStock: number; // date (en ms) à partir de laquelle on compte la recharge
  wiki: Record<number, Carte>; // pages Wikipédia obtenues (titre, image, rareté…)
};

// Jusqu'à 10 paquets en réserve, 1 paquet de plus toutes les 5 minutes
export const STOCK_MAX = 10;
export const DELAI_RECHARGE = 5 * 60 * 1000;

const CLE = "pack-opening:collection";
const EVENEMENT = "pack-opening:maj";
const VIDE: Sauvegarde = { cartes: {}, packs: 0, coins: 0, stock: STOCK_MAX, majStock: 0, wiki: {} };

let etat: Sauvegarde | null = null;
let joueur: string | null = null; // id du compte connecté, null sans compte

// Chaque compte a sa propre copie dans le navigateur, à part de la partie sans compte
const cleLocale = () => (joueur ? `${CLE}:${joueur}` : CLE);

function lireLocal(cle: string): Sauvegarde | null {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? { ...VIDE, ...JSON.parse(brut) } : null;
  } catch {
    return null;
  }
}

function lire(): Sauvegarde {
  if (etat === null) {
    try {
      // Compte jamais synchronisé dans ce navigateur : on part de la partie sans compte
      const brut = localStorage.getItem(cleLocale()) ?? (joueur ? localStorage.getItem(CLE) : null);
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
    localStorage.setItem(cleLocale(), JSON.stringify(etat));
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

// ---------- Pages Wikipédia découvertes (table cartes_wiki) ----------

// Retrouve les cartes Wikipédia à partir de leurs identifiants (par paquets de 100)
export async function chargerCartesWiki(ids: number[]): Promise<Record<number, Carte>> {
  const cartes: Record<number, Carte> = {};
  const aChercher = [...new Set(ids.filter(estCarteWiki))];
  if (!supabase || aChercher.length === 0) return cartes;
  for (let i = 0; i < aChercher.length; i += 100) {
    const { data } = await supabase
      .from("cartes_wiki")
      .select("id, carte")
      .in("id", aChercher.slice(i, i + 100))
      .returns<{ id: number; carte: Carte }[]>();
    for (const ligne of data ?? []) cartes[ligne.id] = ligne.carte;
  }
  return cartes;
}

function memoriserCartesWiki(cartes: Carte[]) {
  if (!supabase || !joueur || cartes.length === 0) return;
  supabase
    .from("cartes_wiki")
    .upsert(
      cartes.map((carte) => ({ id: carte.id, carte })),
      { onConflict: "id", ignoreDuplicates: true },
    )
    .then(() => {});
}

// ---------- Synchronisation avec le compte ----------

type LigneJoueur = { coins: number; packs: number; stock: number; maj_stock: string };

// Recharge la collection depuis Supabase (après un échange, au retour sur l'onglet…)
export async function synchroniser() {
  if (!supabase || !joueur) return;
  const id = joueur;
  let { data: infos } = await supabase
    .from("joueurs")
    .select("coins, packs, stock, maj_stock")
    .eq("id", id)
    .maybeSingle<LigneJoueur>();

  // 1re connexion : on importe la partie jouée sans compte dans ce navigateur
  if (!infos) {
    const local = lireLocal(CLE) ?? VIDE;
    const { error } = await supabase.rpc("importer_collection", {
      p_cartes: local.cartes,
      p_coins: local.coins,
      p_packs: local.packs,
      p_stock: local.stock,
      p_maj_stock: new Date(local.majStock || Date.now()).toISOString(),
    });
    if (error) return; // script supabase/echanges.sql pas encore lancé : on reste sur la copie locale
    memoriserCartesWiki(Object.values(local.wiki ?? {}));
    ({ data: infos } = await supabase
      .from("joueurs")
      .select("coins, packs, stock, maj_stock")
      .eq("id", id)
      .maybeSingle<LigneJoueur>());
  }

  const { data: lignes } = await supabase
    .from("collections")
    .select("carte_id, nombre")
    .eq("joueur", id)
    .returns<{ carte_id: number; nombre: number }[]>();
  if (!infos || !lignes || joueur !== id) return;

  // Pages Wikipédia : on garde celles déjà connues ici et on va chercher les autres
  const connues = lire().wiki;
  const inconnues = lignes.map((l) => l.carte_id).filter((c) => estCarteWiki(c) && !connues[c]);
  const wiki = { ...connues, ...(await chargerCartesWiki(inconnues)) };
  if (joueur !== id) return;

  enregistrer({
    wiki,
    cartes: Object.fromEntries(lignes.map((l) => [l.carte_id, l.nombre])),
    coins: infos.coins,
    packs: infos.packs,
    stock: infos.stock,
    majStock: new Date(infos.maj_stock).getTime(),
  });
}

let ecouteRetour = false;

// Appelé quand le joueur se connecte ou se déconnecte
export function definirJoueur(id: string | null) {
  if (id === joueur) return;
  joueur = id;
  etat = null; // on relira la bonne copie (compte ou partie sans compte)
  window.dispatchEvent(new Event(EVENEMENT));
  if (!ecouteRetour) {
    ecouteRetour = true;
    // Un ami a pu accepter un échange pendant ce temps
    window.addEventListener("focus", () => synchroniser());
  }
  synchroniser();
}

// Envoie l'action au serveur ; s'il refuse, on reprend l'état du serveur
function envoyer(nom: string, parametres: Record<string, unknown>) {
  if (!supabase || !joueur) return;
  supabase.rpc(nom, parametres).then(({ error }) => {
    if (error) synchroniser();
  });
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
  const nouvellesWiki = pack.filter((c) => estCarteWiki(c.id));
  const wiki = { ...actuel.wiki };
  for (const carte of nouvellesWiki) wiki[carte.id] ??= carte;
  const { disponibles, depuis } = calculerStock(actuel, Date.now());
  enregistrer({
    ...actuel,
    cartes,
    packs: actuel.packs + 1,
    wiki,
    stock: Math.max(0, disponibles - 1),
    majStock: depuis,
  });
  memoriserCartesWiki(nouvellesWiki);
  envoyer("ouvrir_paquet", { p_cartes: pack.map((c) => c.id) });
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
  envoyer("vendre", { p_ventes: [{ carte: carte.id, nombre: 1, prix: prixDeVente(carte) }] });
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
  const ventes = [];
  for (const carte of toutes) {
    const enTrop = (cartes[carte.id] ?? 0) - 1;
    if (enTrop > 0) {
      ventes.push({ carte: carte.id, nombre: enTrop, prix: prixDeVente(carte) });
      cartes[carte.id] = 1;
    }
  }
  enregistrer({ ...actuel, cartes, coins: actuel.coins + gain });
  envoyer("vendre", { p_ventes: ventes });
}
