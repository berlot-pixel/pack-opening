"use client";

import { useEffect, useRef, useState } from "react";
import { ORDRE_RARETES, RARETES, prixDeVente, type Carte, type Rarete } from "@/lib/cartes";
import { gainDoublons, useCollection, vendreCarte, vendreDoublons } from "@/lib/collection";
import { CarteVisuelle } from "./CarteVisuelle";
import { PieceCoin } from "./Navigation";

// Vendre le dernier exemplaire d'une carte demande un 2e clic pour confirmer
function BoutonVendre({ carte, nombre }: { carte: Carte; nombre: number }) {
  const [confirmer, setConfirmer] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(minuteur.current), []);

  function cliquer() {
    if (nombre > 1 || confirmer) {
      clearTimeout(minuteur.current);
      setConfirmer(false);
      vendreCarte(carte);
      return;
    }
    setConfirmer(true);
    minuteur.current = setTimeout(() => setConfirmer(false), 3000);
  }

  return (
    <button
      onClick={cliquer}
      className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
        confirmer
          ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
          : "bg-surface text-white/80 hover:bg-accent/15 hover:text-accent"
      }`}
    >
      {confirmer ? (
        "Dernier exemplaire, sûr ?"
      ) : (
        <>
          Vendre <span className="text-accent">+{prixDeVente(carte)}</span>
          <PieceCoin className="size-3.5" />
        </>
      )}
    </button>
  );
}

export function Collection({ cartes }: { cartes: Carte[] }) {
  const { cartes: possedees, packs } = useCollection();
  const trouvees = cartes.filter((c) => possedees[c.id]).length;
  const pourcentage = Math.round((trouvees / cartes.length) * 100);
  const gain = gainDoublons(cartes, possedees);

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-bordure bg-panneau p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm text-white/60">
            <span>
              <span className="mr-1.5 font-display text-2xl font-bold text-white">
                {trouvees}
                <span className="text-white/40"> / {cartes.length}</span>
              </span>
              cartes trouvées
            </span>
            <span>{packs} paquets ouverts</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pourcentage}%` }} />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-bordure bg-panneau p-5">
          <button
            onClick={() => vendreDoublons(cartes)}
            disabled={gain === 0}
            className="cursor-pointer rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-default disabled:bg-surface disabled:text-white/40"
          >
            Vendre les doublons
          </button>
          <span className="flex items-center gap-1.5 text-xs text-white/60">
            {gain > 0 ? (
              <>
                Rapporte <span className="font-semibold text-accent">+{gain}</span>
                <PieceCoin className="size-3.5" />
              </>
            ) : (
              "Aucun doublon pour l'instant"
            )}
          </span>
        </div>
      </div>

      {ORDRE_RARETES.map((rarete: Rarete) => {
        const liste = cartes.filter((c) => c.rarete === rarete);
        if (liste.length === 0) return null;
        const trouveesIci = liste.filter((c) => possedees[c.id]).length;

        return (
          <section key={rarete}>
            <h2 className={`mb-5 flex items-center gap-3 font-display text-xl font-bold ${RARETES[rarete].texte}`}>
              {RARETES[rarete].label}
              <span className="text-xs font-medium text-white/40">
                {trouveesIci} / {liste.length}
              </span>
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-white/40">
                {RARETES[rarete].prix} <PieceCoin className="size-3.5" /> l&apos;unité
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {liste.map((carte) => {
                const nombre = possedees[carte.id];
                return nombre ? (
                  <div key={carte.id} className="flex flex-col gap-2">
                    <CarteVisuelle carte={carte} badge={nombre > 1 ? `x${nombre}` : undefined} />
                    <BoutonVendre carte={carte} nombre={nombre} />
                  </div>
                ) : (
                  <div
                    key={carte.id}
                    className="aspect-[5/7] w-full rounded-xl border border-bordure bg-panneau p-1.5"
                  >
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10 font-display text-4xl font-bold text-white/15">
                      ?
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
