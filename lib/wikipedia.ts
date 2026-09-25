import type { Carte, Rarete } from "./cartes";

// Pack Wikipédia : des pages tirées au hasard parmi les 2,7 millions de Wikipédia en français.
// La rareté dépend du nombre moyen de vues par jour sur les 30 derniers jours.

const API = "https://fr.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*";
const VUES = "https://wikimedia.org/api/rest_v1/metrics/pageviews";

// Identifiant de carte = 1 milliard + identifiant de la page (pas de conflit avec les autres extensions)
export const DECALAGE_WIKI = 1_000_000_000;
export const estCarteWiki = (id: number) => id >= DECALAGE_WIKI && id < 2 * DECALAGE_WIKI;

// Environ 70 % des pages au hasard ont moins de 3 vues par jour, 0,5 % plus de 100
const SEUILS: [Rarete, number][] = [
  ["ultra_rare", 5000],
  ["epique", 300],
  ["rare", 20],
  ["peu_commun", 3],
];
const rareteSelonVues = (vues: number): Rarete => SEUILS.find(([, seuil]) => vues >= seuil)?.[0] ?? "commun";

// Pages très lues mais sans intérêt comme carte (bruit des statistiques)
const EXCLUES = new Set(["Cookie (informatique)", "XXX"]);

const jour = (decalage: number) => new Date(Date.now() - decalage * 86_400_000);
const aaaammjj = (date: Date) => date.toISOString().slice(0, 10).replaceAll("-", "");

// Si Wikipédia demande de ralentir (429), on réessaie une fois un peu plus tard
async function charger(url: string) {
  const reponse = await fetch(url);
  if (reponse.status !== 429) return reponse;
  await new Promise((fin) => setTimeout(fin, 800));
  return fetch(url);
}

async function lireJson<T>(url: string): Promise<T> {
  const reponse = await charger(url);
  if (!reponse.ok) throw new Error(`Wikipédia ne répond pas (${reponse.status})`);
  return reponse.json();
}

// Les 1000 pages les plus lues d'un jour récent, gardées en mémoire pendant la visite
let populaires: string[] | null = null;
async function pagesPopulaires(): Promise<string[]> {
  if (populaires) return populaires;
  const date = jour(2).toISOString().slice(0, 10).replaceAll("-", "/"); // les chiffres de la veille arrivent tard
  const donnees = await lireJson<{ items: { articles: { article: string }[] }[] }>(
    `${VUES}/top/fr.wikipedia/all-access/${date}`,
  );
  populaires = donnees.items[0].articles
    .map((a) => a.article.replaceAll("_", " "))
    .filter((titre) => !titre.includes(":") && !EXCLUES.has(titre));
  return populaires;
}

async function vuesParJour(titre: string): Promise<number> {
  const url = `${VUES}/per-article/fr.wikipedia/all-access/user/${encodeURIComponent(titre.replaceAll(" ", "_"))}/daily/${aaaammjj(jour(30))}/${aaaammjj(jour(1))}`;
  const reponse = await charger(url);
  if (reponse.status === 404) return 0; // aucune vue enregistrée
  if (!reponse.ok) throw new Error(`Wikipédia ne répond pas (${reponse.status})`);
  const donnees: { items: { views: number }[] } = await reponse.json();
  return donnees.items.reduce((total, j) => total + j.views, 0) / 30;
}

type Page = {
  pageid?: number;
  title: string;
  missing?: boolean;
  description?: string;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source: string };
  pageprops?: Record<string, string>;
};

async function details(titres: string[]) {
  const parametres = new URLSearchParams({
    titles: titres.join("|"),
    prop: "pageprops|description|pageimages|extracts|info",
    redirects: "1",
    exintro: "1",
    explaintext: "1",
    exsentences: "2",
    exlimit: "max",
    piprop: "thumbnail",
    pithumbsize: "400",
    inprop: "url",
  });
  const donnees = await lireJson<{
    query: { pages: Page[]; redirects?: { from: string; to: string }[]; normalized?: { from: string; to: string }[] };
  }>(`${API}&${parametres}`);
  // Titre demandé → titre réel (après correction et redirection)
  const renvois = new Map<string, string>();
  for (const r of [...(donnees.query.normalized ?? []), ...(donnees.query.redirects ?? [])]) renvois.set(r.from, r.to);
  const titreReel = (titre: string) => {
    let t = titre;
    while (renvois.has(t)) t = renvois.get(t)!;
    return t;
  };
  const valides = donnees.query.pages.filter((p) => p.pageid && !p.missing && !("disambiguation" in (p.pageprops ?? {})));
  return { valides, titreReel };
}

const premierePhrase = (texte = "") => {
  const phrase = texte.split(/(?<=[.!?])\s/)[0] ?? "";
  return phrase.length > 110 ? `${phrase.slice(0, 107)}…` : phrase;
};

function versCarte(page: Page, vues: number): Carte {
  const description = page.description
    ? page.description[0].toUpperCase() + page.description.slice(1)
    : premierePhrase(page.extract);
  return {
    id: DECALAGE_WIKI + page.pageid!,
    nom: page.title,
    emoji: "📄",
    description,
    rarete: rareteSelonVues(vues),
    visuel: "wiki",
    image: page.thumbnail?.source,
    lien: page.fullurl ?? `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`,
    vues: Math.round(vues),
  };
}

// 4 pages au hasard + 1 page parmi les plus lues d'hier (la « rare garantie »)
export async function tirerPackWiki(): Promise<Carte[]> {
  const [hasard, top] = await Promise.all([
    lireJson<{ query: { random: { title: string }[] } }>(`${API}&list=random&rnnamespace=0&rnlimit=12`),
    pagesPopulaires(),
  ]);
  const vedette = top[Math.floor(Math.random() * Math.min(top.length, 500))];
  const { valides, titreReel } = await details([...hasard.query.random.map((p) => p.title), vedette]);

  const titreVedette = titreReel(vedette);
  const pageVedette = valides.find((p) => p.title === titreVedette);
  const autres = valides.filter((p) => p !== pageVedette);
  const choisies = [...autres.slice(0, 4), pageVedette ?? autres[4]].filter((p): p is Page => Boolean(p));
  if (choisies.length < 5) throw new Error("Wikipédia n'a pas renvoyé assez de pages, réessaie.");

  const vues = await Promise.all(choisies.map((p) => vuesParJour(p.title)));
  return choisies.map((page, i) => versCarte(page, vues[i]));
}
