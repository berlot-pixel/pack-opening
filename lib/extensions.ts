import type { Carte } from "./cartes";
import { CARTES_NBA } from "./cartes-nba";
import { CARTES_VILLES } from "./cartes-villes";

export type IdExtension = "maison" | "nba" | "france" | "wikipedia";

export type Extension = {
  id: IdExtension;
  nom: string;
  description: string;
  cartes: Carte[];
  infinie?: boolean; // Wikipédia : pas de liste fixe, seulement les pages déjà découvertes
};

// Les objets de la maison viennent de Supabase, les joueurs NBA et les villes des fichiers générés
// cartesWiki : les pages Wikipédia déjà découvertes (la liste complète n'existe pas)
export function listerExtensions(cartesMaison: Carte[], cartesWiki: Carte[] = []): Extension[] {
  return [
    {
      id: "maison",
      nom: "Maison",
      description: `${cartesMaison.length} objets de la maison`,
      cartes: cartesMaison,
    },
    {
      id: "nba",
      nom: "NBA",
      description: `${CARTES_NBA.length} joueurs NBA de la saison 2026-27`,
      cartes: CARTES_NBA,
    },
    {
      id: "france",
      nom: "Villes de France",
      description: `${CARTES_VILLES.length} villes de France de plus de 30 000 habitants`,
      cartes: CARTES_VILLES,
    },
    {
      id: "wikipedia",
      nom: "Wikipédia",
      description: "les 2,7 millions de pages de Wikipédia",
      cartes: cartesWiki,
      infinie: true,
    },
  ];
}
