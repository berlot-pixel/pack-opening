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
      <div className="border-y border-or/15 py-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-[11px] tracking-[0.25em] text-white/50 uppercase">
          <span>
            <span className="mr-2 font-serif text-3xl tracking-normal text-ivoire normal-case">
              {trouvees}
              <span className="text-white/30"> / {cartes.length}</span>
            </span>
            cartes trouvées
          </span>
          <span>{packs} boosters ouverts</span>
        </div>
        <div className="h-px bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-or/60 to-or-clair transition-all"
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
            <h2 className={`mb-5 flex items-baseline gap-3 font-serif text-2xl ${RARETES[rarete].texte}`}>
              {RARETES[rarete].label}
              <span className="font-sans text-[11px] tracking-[0.2em] text-white/40">
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
                    className="aspect-[5/7] w-full rounded-lg border border-white/10 bg-white/[0.02] p-1.5"
                  >
                    <div className="flex h-full items-center justify-center rounded-[5px] border border-dashed border-white/10 font-serif text-4xl text-white/15 italic">
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
