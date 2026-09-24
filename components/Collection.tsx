"use client";

import { ORDRE_RARETES, RARETES, type Carte } from "@/lib/cartes";
import { useCollection } from "@/lib/collection";
import { CarteVisuelle } from "./CarteVisuelle";

export function Collection({ cartes }: { cartes: Carte[] }) {
  const { cartes: possedees, packs } = useCollection();
  const trouvees = cartes.filter((c) => possedees[c.id]).length;
  const pourcentage = Math.round((trouvees / cartes.length) * 100);

  return (
    <div className="flex flex-col gap-10">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm text-white/80">
          <span>
            <strong className="text-white">{trouvees}</strong> / {cartes.length} cartes trouvées
          </span>
          <span>{packs} boosters ouverts</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-fuchsia-500 transition-all"
            style={{ width: `${pourcentage}%` }}
          />
        </div>
      </div>

      {ORDRE_RARETES.map((rarete) => {
        const liste = cartes.filter((c) => c.rarete === rarete);
        if (liste.length === 0) return null;
        const trouveesIci = liste.filter((c) => possedees[c.id]).length;

        return (
          <section key={rarete}>
            <h2 className={`mb-4 text-xl font-bold ${RARETES[rarete].texte}`}>
              {RARETES[rarete].label}{" "}
              <span className="text-sm font-normal text-white/50">
                {trouveesIci} / {liste.length}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {liste.map((carte) => {
                const nombre = possedees[carte.id];
                return nombre ? (
                  <CarteVisuelle
                    key={carte.id}
                    carte={carte}
                    badge={nombre > 1 ? `x${nombre}` : undefined}
                  />
                ) : (
                  <div
                    key={carte.id}
                    className="flex aspect-[5/7] w-full items-center justify-center rounded-xl border-4 border-dashed border-white/15 bg-white/5 text-4xl font-black text-white/20"
                  >
                    ?
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
