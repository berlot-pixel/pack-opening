import type { Carte } from "./cartes";
import { CARTES_NBA } from "./cartes-nba";

export type IdExtension = "maison" | "nba";

export type Extension = {
  id: IdExtension;
  nom: string;
  description: string;
  cartes: Carte[];
};

// Les objets de la maison viennent de Supabase, les joueurs NBA du fichier généré
export function listerExtensions(cartesMaison: Carte[]): Extension[] {
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
  ];
}
