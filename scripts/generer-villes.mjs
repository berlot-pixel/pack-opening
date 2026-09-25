// Génère lib/cartes-villes.ts : une carte par ville de France de 30 000 habitants ou plus
// (données officielles geo.api.gouv.fr). Relancer pour mettre à jour : node scripts/generer-villes.mjs
import { writeFileSync } from "node:fs";

const API = "https://geo.api.gouv.fr/communes?fields=nom,code,population,departement,region&format=json";
const POPULATION_MIN = 30000;

// Nombre de villes par rareté, de la plus peuplée à la moins peuplée ; le reste est Commun
const PALIERS = [
  ["ultra_rare", 10],
  ["epique", 20],
  ["rare", 45],
  ["peu_commun", 80],
];

// Couleur du blason selon la région
const COULEURS_REGIONS = {
  "Île-de-France": "#1e3a8a",
  "Provence-Alpes-Côte d'Azur": "#0e7490",
  "Auvergne-Rhône-Alpes": "#b91c1c",
  Occitanie: "#c2410c",
  "Pays de la Loire": "#15803d",
  "Grand Est": "#7c2d12",
  "Nouvelle-Aquitaine": "#a16207",
  "Hauts-de-France": "#1d4ed8",
  Bretagne: "#111827",
  Normandie: "#991b1b",
  "Bourgogne-Franche-Comté": "#6b21a8",
  "Centre-Val de Loire": "#0f766e",
  Corse: "#374151",
};
const COULEUR_OUTRE_MER = "#0369a1";

// Identifiants à partir du code INSEE, décalés pour ne pas croiser ceux des autres extensions
// (les codes corses 2A/2B deviennent 200/210)
const identifiant = (code) => 90_000_000 + Number(code.replace("2A", "200").replace("2B", "210"));

const habitants = (n) => `${n.toLocaleString("fr-FR").replace(/\s/g, " ")} habitants`;

const reponse = await fetch(API);
if (!reponse.ok) throw new Error(`${reponse.status} sur ${API}`);
const villes = (await reponse.json())
  .filter((c) => c.population >= POPULATION_MIN)
  .sort((a, b) => b.population - a.population);

const cartes = villes.map((ville, rang) => {
  let rarete = "commun";
  let limite = 0;
  for (const [palier, nombre] of PALIERS) {
    limite += nombre;
    if (rang < limite) {
      rarete = palier;
      break;
    }
  }
  return {
    id: identifiant(ville.code),
    nom: ville.nom,
    emoji: "🏙️",
    description: habitants(ville.population),
    rarete,
    visuel: "blason",
    equipe: ville.region.nom,
    poste: ville.departement.nom,
    sigle: ville.departement.code,
    couleur: COULEURS_REGIONS[ville.region.nom] ?? COULEUR_OUTRE_MER,
    couleurTexte: "#ffffff",
  };
});

cartes.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

writeFileSync(
  new URL("../lib/cartes-villes.ts", import.meta.url),
  `// Fichier généré par scripts/generer-villes.mjs (geo.api.gouv.fr) — ne pas modifier à la main
import type { Carte } from "./cartes";

export const CARTES_VILLES: Carte[] = ${JSON.stringify(cartes, null, 2)};
`,
);
console.log(`${cartes.length} villes`);
for (const [rarete] of PALIERS) {
  console.log(rarete, cartes.filter((c) => c.rarete === rarete).map((c) => c.nom).join(", "));
}
