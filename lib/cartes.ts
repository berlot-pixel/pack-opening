export type Rarete = "commun" | "peu_commun" | "rare" | "epique" | "ultra_rare";

export type Carte = {
  id: number;
  nom: string;
  emoji: string;
  description: string;
  rarete: Rarete;
};

export const ORDRE_RARETES: Rarete[] = ["ultra_rare", "epique", "rare", "peu_commun", "commun"];

export const RARETES: Record<
  Rarete,
  { label: string; classes: string; texte: string }
> = {
  commun: {
    label: "Commune",
    classes: "border-zinc-500 bg-gradient-to-b from-zinc-700 to-zinc-900",
    texte: "text-zinc-300",
  },
  peu_commun: {
    label: "Peu commune",
    classes: "border-emerald-400 bg-gradient-to-b from-emerald-800 to-zinc-900",
    texte: "text-emerald-300",
  },
  rare: {
    label: "Rare",
    classes:
      "border-sky-400 bg-gradient-to-b from-sky-800 to-zinc-900 shadow-lg shadow-sky-500/30",
    texte: "text-sky-300",
  },
  epique: {
    label: "Épique",
    classes:
      "border-purple-400 bg-gradient-to-b from-purple-800 to-zinc-900 shadow-xl shadow-purple-500/50",
    texte: "text-purple-300",
  },
  ultra_rare: {
    label: "Ultra rare",
    classes: "carte-holo border-amber-300 shadow-2xl shadow-amber-400/60",
    texte: "text-amber-200",
  },
};

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
