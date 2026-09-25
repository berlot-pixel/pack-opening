export type Rarete = "commun" | "peu_commun" | "rare" | "epique" | "ultra_rare";

export type Carte = {
  id: number;
  nom: string;
  emoji: string;
  description: string;
  rarete: Rarete;
  // Cartes de joueurs (NBA) ou de villes : on dessine un maillot ou un blason à la place de l'emoji
  visuel?: "maillot" | "blason";
  equipe?: string;
  sigle?: string;
  poste?: string;
  numero?: string;
  couleur?: string;
  couleurTexte?: string;
};

export const ORDRE_RARETES: Rarete[] = ["ultra_rare", "epique", "rare", "peu_commun", "commun"];

export const RARETES: Record<
  Rarete,
  { label: string; classes: string; texte: string; prix: number }
> = {
  // Chaque rareté a sa teinte de métal : pierre, vert-de-gris, saphir, améthyste, or
  commun: {
    label: "Commune",
    classes: "border-stone-600/70 bg-gradient-to-b from-[#1c1b19] to-[#0f0e0d]",
    texte: "text-stone-400",
    prix: 5,
  },
  peu_commun: {
    label: "Peu commune",
    classes: "border-[#5f8a7c]/70 bg-gradient-to-b from-[#16201d] to-[#0e0f0e]",
    texte: "text-[#8fb5a8]",
    prix: 15,
  },
  rare: {
    label: "Rare",
    classes:
      "border-[#6f8fb8]/80 bg-gradient-to-b from-[#161c27] to-[#0d0e11] shadow-lg shadow-[#6f8fb8]/10",
    texte: "text-[#a4bddc]",
    prix: 40,
  },
  epique: {
    label: "Épique",
    classes:
      "border-[#9a7cc0]/80 bg-gradient-to-b from-[#1e1826] to-[#0e0d11] shadow-xl shadow-[#9a7cc0]/15",
    texte: "text-[#c4b0e0]",
    prix: 120,
  },
  ultra_rare: {
    label: "Ultra rare",
    classes: "carte-doree border-or shadow-2xl shadow-or/25",
    texte: "text-or-clair",
    prix: 400,
  },
};

// Prix de revente en coins : plus une carte est rare, plus elle rapporte
// (un booster revendu en entier rapporte environ 130 coins en moyenne)
export const prixDeVente = (carte: Carte) => RARETES[carte.rarete].prix;

// Chances en % pour une carte normale, et pour la dernière carte du pack (garantie Rare ou mieux)
const CHANCES_NORMALES: [Rarete, number][] = [
  ["commun", 65],
  ["peu_commun", 25],
  ["rare", 7],
  ["epique", 2.5],
  ["ultra_rare", 0.5],
];
const CHANCES_DERNIERE: [Rarete, number][] = [
  ["rare", 75],
  ["epique", 20],
  ["ultra_rare", 5],
];

export const TAILLE_PACK = 5;

function tirerRarete(chances: [Rarete, number][]): Rarete {
  const total = chances.reduce((somme, [, poids]) => somme + poids, 0);
  let tirage = Math.random() * total;
  for (const [rarete, poids] of chances) {
    tirage -= poids;
    if (tirage < 0) return rarete;
  }
  return chances[0][0];
}

export function tirerPack(cartes: Carte[]): Carte[] {
  const pack: Carte[] = [];
  for (let i = 0; i < TAILLE_PACK; i++) {
    const chances = i === TAILLE_PACK - 1 ? CHANCES_DERNIERE : CHANCES_NORMALES;
    const rarete = tirerRarete(chances);
    const candidates = cartes.filter((c) => c.rarete === rarete);
    const liste = candidates.length > 0 ? candidates : cartes;
    pack.push(liste[Math.floor(Math.random() * liste.length)]);
  }
  return pack;
}
