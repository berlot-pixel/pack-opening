"use client";

import { useState } from "react";
import { tirerPack, type Carte } from "@/lib/cartes";
import { ajouterPack, useCollection } from "@/lib/collection";
import { CarteVisuelle, DosDeCarte } from "./CarteVisuelle";

type Etape = "ferme" | "ouverture" | "revele";

export function OuvreurDePack({ cartes }: { cartes: Carte[] }) {
  const collection = useCollection();
  const [etape, setEtape] = useState<Etape>("ferme");
  const [pack, setPack] = useState<Carte[]>([]);
  const [nouvelles, setNouvelles] = useState<Set<number>>(new Set());
  const [retournees, setRetournees] = useState<boolean[]>([]);

  function ouvrir() {
    const tirage = tirerPack(cartes);
    setNouvelles(new Set(tirage.filter((c) => !collection.cartes[c.id]).map((c) => c.id)));
    setPack(tirage);
    setRetournees(tirage.map(() => false));
    ajouterPack(tirage);
    setEtape("ouverture");
    setTimeout(() => setEtape("revele"), 800);
  }

  function retourner(index: number) {
    setRetournees((r) => r.map((v, i) => (i === index ? true : v)));
  }

  const toutRetourne = retournees.length > 0 && retournees.every(Boolean);

  if (etape !== "revele") {
    return (
      <div className="flex flex-col items-center gap-8">
        <button
          onClick={ouvrir}
          disabled={etape === "ouverture"}
          className={`group relative flex h-80 w-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-4 border-yellow-300 bg-gradient-to-br from-fuchsia-600 via-violet-700 to-indigo-800 shadow-2xl shadow-violet-500/40 transition hover:scale-105 hover:rotate-1 ${
            etape === "ouverture" ? "pack-secoue" : ""
          }`}
        >
          <span className="text-7xl transition group-hover:scale-110">🏠</span>
          <span className="text-2xl font-black tracking-wide text-yellow-300 drop-shadow">
            BOOSTER
          </span>
          <span className="text-sm text-white/80">Objets de la maison</span>
          <span className="text-xs text-white/60">5 cartes · 1 Rare garantie</span>
        </button>
        <p className="text-white/70">Clique sur le booster pour l&apos;ouvrir !</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {pack.map((carte, i) => (
          <button
            key={i}
            onClick={() => retourner(i)}
            style={{ animationDelay: `${i * 120}ms` }}
            className={`carte-arrive carte-flip aspect-[5/7] w-full cursor-pointer ${
              retournees[i] ? "retournee" : "transition hover:-translate-y-2"
            }`}
            aria-label={retournees[i] ? carte.nom : "Retourner la carte"}
          >
            <div className="carte-flip-inner">
              <div className="carte-face">
                <DosDeCarte />
              </div>
              <div className="carte-face carte-face-avant">
                <CarteVisuelle carte={carte} badge={nouvelles.has(carte.id) ? "NOUVELLE" : undefined} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {toutRetourne ? (
        <button
          onClick={ouvrir}
          className="cursor-pointer rounded-full bg-yellow-400 px-8 py-3 text-lg font-bold text-black shadow-lg transition hover:scale-105 hover:bg-yellow-300"
        >
          Ouvrir un autre booster
        </button>
      ) : (
        <button
          onClick={() => setRetournees(pack.map(() => true))}
          className="cursor-pointer rounded-full border border-white/30 px-6 py-2 text-white/80 transition hover:bg-white/10"
        >
          Tout retourner
        </button>
      )}
    </div>
  );
}
