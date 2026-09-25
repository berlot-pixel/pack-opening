"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { chargerRelations } from "@/lib/amis";
import { ORDRE_RARETES, RARETES, type Carte } from "@/lib/cartes";
import { chargerCartesWiki, synchroniser, useCollection } from "@/lib/collection";
import { useCompte, type Profil } from "@/lib/compte";
import {
  accepterEchange,
  annulerEchange,
  chargerCollectionDe,
  chargerEchanges,
  proposerEchange,
  type Echange,
} from "@/lib/echanges";
import { listerExtensions, type IdExtension } from "@/lib/extensions";

type Selection = Record<number, number>;

// Petite vignette de carte : emoji, maillot ou blason en réduction
function MiniCarte({ carte }: { carte: Carte }) {
  const rarete = RARETES[carte.rarete];
  return (
    <span
      className={`flex h-12 w-9 shrink-0 items-center justify-center rounded-md border text-lg ${rarete.classes}`}
    >
      {carte.couleur ? (
        <span
          className="flex size-6 items-center justify-center rounded-sm font-display text-[10px] font-black"
          style={{ background: carte.couleur, color: carte.couleurTexte }}
        >
          {carte.visuel === "blason" ? carte.sigle : carte.numero || "–"}
        </span>
      ) : (
        carte.emoji
      )}
    </span>
  );
}

// Liste des cartes possédées (les siennes ou celles d'un ami), avec - / + pour en choisir
function SelecteurCartes({
  titre,
  catalogue,
  possedees,
  selection,
  changer,
}: {
  titre: string;
  catalogue: { id: IdExtension; nom: string; cartes: Carte[] }[];
  possedees: Record<number, number>;
  selection: Selection;
  changer: (selection: Selection) => void;
}) {
  const [extension, setExtension] = useState<IdExtension | "tout">("tout");
  const [recherche, setRecherche] = useState("");

  const liste = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return catalogue
      .filter((e) => extension === "tout" || e.id === extension)
      .flatMap((e) => e.cartes)
      .filter((c) => possedees[c.id] && (!texte || c.nom.toLowerCase().includes(texte)))
      .sort(
        (a, b) =>
          ORDRE_RARETES.indexOf(a.rarete) - ORDRE_RARETES.indexOf(b.rarete) || a.nom.localeCompare(b.nom, "fr"),
      );
  }, [catalogue, extension, recherche, possedees]);

  function modifier(carte: Carte, delta: number) {
    const nombre = Math.min(possedees[carte.id] ?? 0, Math.max(0, (selection[carte.id] ?? 0) + delta));
    const nouvelle = { ...selection };
    if (nombre === 0) delete nouvelle[carte.id];
    else nouvelle[carte.id] = nombre;
    changer(nouvelle);
  }

  const total = Object.values(selection).reduce((a, b) => a + b, 0);

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-bordure bg-panneau p-4">
      <h3 className="font-display font-bold">
        {titre} {total > 0 && <span className="text-accent">· {total}</span>}
      </h3>
      <div className="flex flex-wrap gap-1">
        {[{ id: "tout" as const, nom: "Tout" }, ...catalogue].map((e) => (
          <button
            key={e.id}
            onClick={() => setExtension(e.id)}
            className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-bold transition ${
              extension === e.id ? "bg-accent/15 text-accent" : "text-white/50 hover:text-white"
            }`}
          >
            {e.nom}
          </button>
        ))}
      </div>
      <input
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher une carte"
        className="rounded-lg border border-bordure bg-surface px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-accent"
      />
      <div className="flex max-h-80 flex-col gap-1 overflow-y-auto pr-1">
        {liste.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">Aucune carte</p>
        ) : (
          liste.map((carte) => {
            const choisies = selection[carte.id] ?? 0;
            return (
              <div
                key={carte.id}
                className={`flex items-center gap-2.5 rounded-lg p-1.5 transition ${choisies ? "bg-accent/10" : "hover:bg-white/5"}`}
              >
                <MiniCarte carte={carte} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{carte.nom}</p>
                  <p className={`text-[11px] ${RARETES[carte.rarete].texte}`}>
                    {RARETES[carte.rarete].label} <span className="text-white/40">· x{possedees[carte.id]}</span>
                  </p>
                </div>
                {choisies > 0 && (
                  <button
                    onClick={() => modifier(carte, -1)}
                    className="size-7 cursor-pointer rounded-md bg-surface text-white/70 hover:text-white"
                    aria-label={`Retirer ${carte.nom}`}
                  >
                    −
                  </button>
                )}
                {choisies > 0 && <span className="w-4 text-center text-sm font-bold text-accent">{choisies}</span>}
                <button
                  onClick={() => modifier(carte, 1)}
                  disabled={choisies >= possedees[carte.id]}
                  className="size-7 cursor-pointer rounded-md bg-surface text-white/70 hover:text-accent disabled:cursor-default disabled:opacity-30"
                  aria-label={`Ajouter ${carte.nom}`}
                >
                  +
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Cartes d'un échange regroupées : vignette, nom et nombre d'exemplaires
function ResumeCartes({ ids, parId }: { ids: number[]; parId: Map<number, Carte> }) {
  if (ids.length === 0) return <p className="text-sm text-white/40">Rien</p>;
  const comptes = new Map<number, number>();
  for (const id of ids) comptes.set(id, (comptes.get(id) ?? 0) + 1);
  return (
    <div className="flex flex-col gap-1">
      {[...comptes].map(([id, nombre]) => {
        const carte = parId.get(id);
        return (
          <div key={id} className="flex items-center gap-2">
            {carte && <MiniCarte carte={carte} />}
            <span className="text-sm">{carte?.nom ?? "Carte inconnue"}</span>
            {nombre > 1 && <span className="text-xs font-bold text-accent">x{nombre}</span>}
          </div>
        );
      })}
    </div>
  );
}

const enListe = (selection: Selection) =>
  Object.entries(selection).flatMap(([id, nombre]) => Array<number>(nombre).fill(Number(id)));

export function Echanges({ cartesMaison }: { cartesMaison: Carte[] }) {
  const { chargement, session, profil } = useCompte();
  const monId = profil?.id;
  const maCollection = useCollection();

  // Pages Wikipédia des amis et des échanges, que ma collection ne connaît pas encore
  const [wikiEnPlus, setWikiEnPlus] = useState<Record<number, Carte>>({});
  const catalogue = useMemo(
    () => listerExtensions(cartesMaison, Object.values({ ...wikiEnPlus, ...maCollection.wiki })),
    [cartesMaison, wikiEnPlus, maCollection.wiki],
  );
  const parId = useMemo(
    () => new Map(catalogue.flatMap((e) => e.cartes).map((c) => [c.id, c] as const)),
    [catalogue],
  );

  const [amis, setAmis] = useState<Profil[]>([]);
  const [echanges, setEchanges] = useState<Echange[] | null>(null);
  const [ami, setAmi] = useState<Profil | null>(null);
  const [collectionAmi, setCollectionAmi] = useState<Record<number, number>>({});
  const [donne, setDonne] = useState<Selection>({});
  const [demande, setDemande] = useState<Selection>({});
  const [retour, setRetour] = useState<{ erreur?: string; message?: string }>({});
  const [envoi, setEnvoi] = useState(false);

  const completerWiki = useCallback(async (ids: number[]) => {
    const trouvees = await chargerCartesWiki(ids);
    if (Object.keys(trouvees).length) setWikiEnPlus((avant) => ({ ...avant, ...trouvees }));
  }, []);

  const recharger = useCallback(async () => {
    if (!monId) return;
    const [relations, liste] = await Promise.all([chargerRelations(monId), chargerEchanges()]);
    setAmis(relations.relations.filter((r) => r.acceptee).map((r) => r.ami));
    setEchanges(liste.echanges);
    if (liste.erreur) setRetour({ erreur: liste.erreur });
    await completerWiki(liste.echanges.flatMap((e) => [...e.donne, ...e.demande]));
  }, [monId, completerWiki]);

  useEffect(() => {
    if (!monId) return;
    let actif = true;
    Promise.all([chargerRelations(monId), chargerEchanges()]).then(([relations, liste]) => {
      if (!actif) return;
      setAmis(relations.relations.filter((r) => r.acceptee).map((r) => r.ami));
      setEchanges(liste.echanges);
      if (liste.erreur) setRetour({ erreur: liste.erreur });
      completerWiki(liste.echanges.flatMap((e) => [...e.donne, ...e.demande]));
    });
    const auRetour = () => recharger();
    window.addEventListener("focus", auRetour);
    return () => {
      actif = false;
      window.removeEventListener("focus", auRetour);
    };
  }, [monId, recharger, completerWiki]);

  async function choisirAmi(choix: Profil) {
    setAmi(choix);
    setDonne({});
    setDemande({});
    setRetour({});
    const collection = await chargerCollectionDe(choix.id);
    setCollectionAmi(collection);
    await completerWiki(Object.keys(collection).map(Number));
  }

  async function proposer() {
    if (!ami) return;
    setEnvoi(true);
    const resultat = await proposerEchange(ami.id, enListe(donne), enListe(demande));
    if (resultat.erreur) setRetour(resultat);
    else {
      setRetour({ message: `Échange proposé à ${ami.pseudo} !` });
      setDonne({});
      setDemande({});
    }
    await recharger();
    setEnvoi(false);
  }

  async function repondre(action: Promise<{ erreur?: string }>, succes: string) {
    const resultat = await action;
    setRetour(resultat.erreur ? resultat : { message: succes });
    await Promise.all([recharger(), synchroniser()]);
    if (ami) setCollectionAmi(await chargerCollectionDe(ami.id));
  }

  if (chargement) return <div className="h-60 w-full max-w-4xl animate-pulse rounded-2xl bg-panneau" />;

  if (!session || !monId) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-bordure bg-panneau p-8 text-center">
        <p className="text-white/70">Connecte-toi pour échanger des cartes avec tes amis.</p>
        <Link
          href="/connexion"
          className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
        >
          Se connecter ou créer un compte
        </Link>
      </div>
    );
  }

  const enAttente = echanges?.filter((e) => e.statut === "en_attente") ?? [];
  const recus = enAttente.filter((e) => e.destinataire.id === monId);
  const envoyes = enAttente.filter((e) => e.proposeur.id === monId);
  const historique = echanges?.filter((e) => e.statut !== "en_attente").slice(0, 8) ?? [];
  const rien = enListe(donne).length + enListe(demande).length === 0;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-8">
      {(retour.erreur || retour.message) && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${retour.erreur ? "bg-red-500/10 text-red-300" : "bg-accent/10 text-accent"}`}
        >
          {retour.erreur ?? retour.message}
        </p>
      )}

      {recus.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold">
            Propositions reçues <span className="text-accent">{recus.length}</span>
          </h2>
          {recus.map((e) => (
            <div key={e.id} className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
              <p className="font-semibold">{e.proposeur.pseudo} te propose un échange</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs text-white/50">Tu reçois</p>
                  <ResumeCartes ids={e.donne} parId={parId} />
                </div>
                <div>
                  <p className="mb-2 text-xs text-white/50">Tu donnes</p>
                  <ResumeCartes ids={e.demande} parId={parId} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => repondre(accepterEchange(e.id), "Échange accepté ! Les cartes sont dans ta collection.")}
                  className="cursor-pointer rounded-xl bg-accent px-5 py-2 text-sm font-bold text-black transition hover:brightness-110"
                >
                  Accepter
                </button>
                <button
                  onClick={() => repondre(annulerEchange(e.id), "Échange refusé.")}
                  className="cursor-pointer rounded-xl px-5 py-2 text-sm font-semibold text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold">Proposer un échange</h2>
        {amis.length === 0 ? (
          <p className="rounded-xl border border-dashed border-bordure p-5 text-center text-sm text-white/50">
            Ajoute d&apos;abord des amis sur la page{" "}
            <Link href="/amis" className="font-semibold text-accent">
              Amis
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {amis.map((a) => (
                <button
                  key={a.id}
                  onClick={() => choisirAmi(a)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    ami?.id === a.id
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-bordure bg-panneau text-white/70 hover:text-white"
                  }`}
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent/15 font-display text-xs font-bold text-accent">
                    {a.pseudo[0].toUpperCase()}
                  </span>
                  {a.pseudo}
                </button>
              ))}
            </div>

            {ami ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelecteurCartes
                    titre="Tu donnes"
                    catalogue={catalogue}
                    possedees={maCollection.cartes}
                    selection={donne}
                    changer={setDonne}
                  />
                  <SelecteurCartes
                    titre={`Tu demandes à ${ami.pseudo}`}
                    catalogue={catalogue}
                    possedees={collectionAmi}
                    selection={demande}
                    changer={setDemande}
                  />
                </div>
                <button
                  onClick={proposer}
                  disabled={rien || envoi}
                  className="self-center cursor-pointer rounded-xl bg-accent px-8 py-3 font-display font-bold text-black transition hover:brightness-110 disabled:cursor-default disabled:bg-surface disabled:text-white/40"
                >
                  {rien ? "Choisis des cartes" : `Proposer l'échange à ${ami.pseudo}`}
                </button>
              </>
            ) : (
              <p className="text-sm text-white/50">Choisis l&apos;ami avec qui tu veux échanger.</p>
            )}
          </>
        )}
      </section>

      {envoyes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold text-white/70">En attente de réponse</h2>
          {envoyes.map((e) => (
            <div
              key={e.id}
              className="flex flex-col gap-3 rounded-2xl border border-bordure bg-panneau p-4 sm:flex-row sm:items-start"
            >
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs text-white/50">Tu donnes à {e.destinataire.pseudo}</p>
                  <ResumeCartes ids={e.donne} parId={parId} />
                </div>
                <div>
                  <p className="mb-2 text-xs text-white/50">Tu reçois</p>
                  <ResumeCartes ids={e.demande} parId={parId} />
                </div>
              </div>
              <button
                onClick={() => repondre(annulerEchange(e.id), "Proposition annulée.")}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
              >
                Annuler
              </button>
            </div>
          ))}
        </section>
      )}

      {historique.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold text-white/70">Derniers échanges</h2>
          {historique.map((e) => {
            const autre = e.proposeur.id === monId ? e.destinataire : e.proposeur;
            const libelle = { acceptee: "accepté", refusee: "refusé", annulee: "annulé", en_attente: "" }[e.statut];
            return (
              <p key={e.id} className="text-sm text-white/50">
                Échange avec <strong className="text-white/80">{autre.pseudo}</strong> :{" "}
                <span className={e.statut === "acceptee" ? "text-accent" : ""}>{libelle}</span> ({e.donne.length} contre{" "}
                {e.demande.length} carte{e.demande.length > 1 ? "s" : ""})
              </p>
            );
          })}
        </section>
      )}
    </div>
  );
}
