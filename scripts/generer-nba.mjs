// Génère lib/cartes-nba.ts : une carte par joueur des effectifs NBA actuels (données ESPN).
// Relancer pour mettre à jour les effectifs : node scripts/generer-nba.mjs
import { writeFileSync } from "node:fs";

const API = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const STATS =
  "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete" +
  "?region=us&lang=en&contentorigin=espn&isqualified=false&limit=1000&seasontype=2";
const SAISON_STATS = 2026; // saison 2025-26

// Nombre de joueurs par rareté, du meilleur au moins bon ; le reste est Commun
const PALIERS = [
  ["ultra_rare", 12],
  ["epique", 30],
  ["rare", 70],
  ["peu_commun", 130],
];

const POSTES = {
  PG: "Meneur",
  SG: "Arrière",
  G: "Arrière",
  SF: "Ailier",
  F: "Ailier",
  PF: "Ailier fort",
  C: "Pivot",
};

async function lireJson(url) {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`${reponse.status} sur ${url}`);
  return reponse.json();
}

// Texte noir sur les maillots clairs, blanc sur les foncés
function texteLisible(hex) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#111111" : "#ffffff";
}

const virgule = (n) => n.toFixed(1).replace(".", ",");

const equipes = (await lireJson(`${API}/teams`)).sports[0].leagues[0].teams.map((t) => t.team);

// Stats de la saison passée : points, rebonds, passes, interceptions, contres par match
const stats = new Map();
const reponseStats = await lireJson(`${STATS}&season=${SAISON_STATS}`);
// Les noms des colonnes sont donnés une seule fois, pour toute la réponse
const colonnes = Object.fromEntries(reponseStats.categories.map((c) => [c.name, c.names]));
for (const { athlete, categories } of reponseStats.athletes) {
  const valeur = (categorie, nom) => {
    const c = categories.find((x) => x.name === categorie);
    return Number(c?.totals[colonnes[categorie].indexOf(nom)]) || 0;
  };
  stats.set(athlete.id, {
    matchs: valeur("general", "gamesPlayed"),
    points: valeur("offensive", "avgPoints"),
    rebonds: valeur("general", "avgRebounds"),
    passes: valeur("offensive", "avgAssists"),
    interceptions: valeur("defensive", "avgSteals"),
    contres: valeur("defensive", "avgBlocks"),
  });
}

const joueurs = [];
for (const equipe of equipes) {
  const effectif = await lireJson(`${API}/teams/${equipe.id}/roster`);
  for (const joueur of effectif.athletes) {
    const s = stats.get(joueur.id);
    // Note d'impact par match, un peu réduite pour ceux qui ont peu joué
    const note = s
      ? (s.points + 1.2 * s.rebonds + 1.5 * s.passes + 2 * (s.interceptions + s.contres)) *
        (s.matchs >= 20 ? 1 : 0.85)
      : 0;
    const couleur = equipe.color ?? "333333";
    joueurs.push({
      id: Number(joueur.id),
      nom: joueur.displayName,
      emoji: "🏀",
      description: s
        ? `${virgule(s.points)} pts · ${virgule(s.rebonds)} reb · ${virgule(s.passes)} pd`
        : "Rookie · pas encore de stats NBA",
      rarete: "commun",
      equipe: equipe.displayName,
      sigle: equipe.abbreviation,
      poste: POSTES[joueur.position?.abbreviation] ?? "Joueur",
      numero: joueur.jersey ?? "",
      couleur: `#${couleur}`,
      couleurTexte: texteLisible(couleur),
      note,
    });
  }
}

joueurs.sort((a, b) => b.note - a.note);
let rang = 0;
for (const [rarete, nombre] of PALIERS) {
  for (const joueur of joueurs.slice(rang, rang + nombre)) joueur.rarete = rarete;
  rang += nombre;
}

const cartes = joueurs
  .map(({ note, ...carte }) => carte)
  .sort((a, b) => a.equipe.localeCompare(b.equipe) || a.nom.localeCompare(b.nom));

writeFileSync(
  new URL("../lib/cartes-nba.ts", import.meta.url),
  `// Fichier généré par scripts/generer-nba.mjs (données ESPN, effectifs ${effectifSaison()}) — ne pas modifier à la main
import type { Carte } from "./cartes";

export const CARTES_NBA: Carte[] = ${JSON.stringify(cartes, null, 2)};
`,
);
console.log(`${cartes.length} joueurs de ${equipes.length} équipes`);
for (const [rarete] of PALIERS) console.log(rarete, cartes.filter((c) => c.rarete === rarete).length);

function effectifSaison() {
  const annee = SAISON_STATS;
  return `${annee}-${String(annee + 1).slice(2)}`;
}
