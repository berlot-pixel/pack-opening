"use client";

import { useMemo, useState } from "react";
import { ORDRE_RARETES, RARETES, type Carte, type Rarete } from "@/lib/cartes";
import { useCollection } from "@/lib/collection";
import { listerExtensions, type IdExtension } from "@/lib/extensions";
import { CarteVisuelle } from "./CarteVisuelle";
import { PieceCoin } from "./Navigation";

type Filtre = "toutes" | "obtenues" | "manquantes";

const PUCE = (actif: boolean) =>
  `cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition ${
    actif ? "bg-accent/15 text-accent" : "text-white/55 hover:text-white"
  }`;

// Au-delà, on affiche les cartes par tranches pour que la page reste fluide
const PAR_TRANCHE = 60;

export function Catalogue({ cartesMaison }: { cartesMaison: Carte[] }) {
  const { cartes: possedees, wiki } = useCollection();
  const extensions = useMemo(
    () => listerExtensions(cartesMaison, Object.values(wiki).filter((c) => possedees[c.id])),
    [cartesMaison, wiki, possedees],
  );
  const [idExtension, setIdExtension] = useState<IdExtension>("maison");
  const [rarete, setRarete] = useState<Rarete | "toutes">("toutes");
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [recherche, setRecherche] = useState("");
  const [affichees, setAffichees] = useState(PAR_TRANCHE);

  const extension = extensions.find((e) => e.id === idExtension)!;

  const liste = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return extension.cartes
      .filter((c) => rarete === "toutes" || c.rarete === rarete)
      .filter((c) => filtre === "toutes" || (filtre === "obtenues") === Boolean(possedees[c.id]))
      .filter(
        (c) =>
          !texte ||
          c.nom.toLowerCase().includes(texte) ||
          c.equipe?.toLowerCase().includes(texte) ||
          c.poste?.toLowerCase().includes(texte),
      )
      .sort(
        (a, b) =>
          ORDRE_RARETES.indexOf(a.rarete) - ORDRE_RARETES.indexOf(b.rarete) || a.nom.localeCompare(b.nom, "fr"),
      );
  }, [extension, rarete, filtre, recherche, possedees]);

  // Tout changement de filtre repart de la première tranche
  function filtrer<T>(changer: (valeur: T) => void) {
    return (valeur: T) => {
      changer(valeur);
      setAffichees(PAR_TRANCHE);
    };
  }

  const obtenues = extension.cartes.filter((c) => possedees[c.id]).length;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-1 rounded-xl border border-bordure bg-panneau p-1">
          {extensions.map((e) => (
            <button
              key={e.id}
              onClick={() => filtrer(setIdExtension)(e.id)}
              className={`cursor-pointer rounded-lg px-5 py-2 font-display text-sm font-bold transition ${
                e.id === idExtension ? "bg-accent/15 text-accent" : "text-white/60 hover:text-white"
              }`}
            >
              {e.nom}
              <span className="ml-2 text-xs font-medium opacity-60">{e.infinie ? "∞" : e.cartes.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-bordure bg-panneau p-4">
        <input
          value={recherche}
          onChange={(e) => filtrer(setRecherche)(e.target.value)}
          placeholder={
            idExtension === "nba"
              ? "Rechercher un joueur ou une équipe"
              : idExtension === "wikipedia"
                ? "Rechercher une page découverte"
              : idExtension === "france"
                ? "Rechercher une ville ou un département"
                : "Rechercher un objet"
          }
          className="rounded-xl border border-bordure bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-accent"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <button onClick={() => filtrer(setRarete)("toutes")} className={PUCE(rarete === "toutes")}>
              Toutes les raretés
            </button>
            {ORDRE_RARETES.map((r) => (
              <button key={r} onClick={() => filtrer(setRarete)(r)} className={PUCE(rarete === r)}>
                <span className={rarete === r ? "" : RARETES[r].texte}>{RARETES[r].label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["toutes", "obtenues", "manquantes"] as Filtre[]).map((f) => (
              <button key={f} onClick={() => filtrer(setFiltre)(f)} className={PUCE(filtre === f)}>
                {{ toutes: "Toutes", obtenues: "Obtenues", manquantes: "Manquantes" }[f]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/45">
          {extension.infinie ? (
            <>
              Collection infinie : n&apos;importe quelle page de Wikipédia peut sortir d&apos;un paquet. Voici les{" "}
              <span className="font-semibold text-accent">{obtenues}</span> que tu as découvertes.
            </>
          ) : (
            <>
              {liste.length} carte{liste.length > 1 ? "s" : ""} · tu en as obtenu{" "}
              <span className="font-semibold text-accent">{obtenues}</span> sur {extension.cartes.length}
            </>
          )}
        </p>
      </div>

      {liste.length === 0 ? (
        <p className="py-10 text-center text-white/40">Aucune carte ne correspond à ta recherche.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {liste.slice(0, affichees).map((carte) => {
            const nombre = possedees[carte.id] ?? 0;
            return (
              <div key={carte.id} className="flex flex-col gap-1.5">
                <div className={nombre ? "" : "opacity-45 grayscale transition hover:opacity-80 hover:grayscale-0"}>
                  <CarteVisuelle carte={carte} badge={nombre > 1 ? `x${nombre}` : undefined} />
                </div>
                <p className="flex items-center justify-center gap-1 text-[11px] text-white/45">
                  {carte.lien ? (
                    <a href={carte.lien} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">
                      Lire sur Wikipédia
                    </a>
                  ) : nombre ? (
                    <span className="font-semibold text-accent">Obtenue</span>
                  ) : (
                    "Pas encore obtenue"
                  )}
                  <span>·</span>
                  {RARETES[carte.rarete].prix}
                  <PieceCoin className="size-3" />
                </p>
              </div>
            );
          })}
        </div>
      )}

      {liste.length > affichees && (
        <button
          onClick={() => setAffichees((n) => n + PAR_TRANCHE)}
          className="self-center cursor-pointer rounded-xl border border-bordure bg-panneau px-6 py-2.5 text-sm font-semibold text-white/70 transition hover:border-accent hover:text-accent"
        >
          Voir plus ({liste.length - affichees} restantes)
        </button>
      )}
    </div>
  );
}
