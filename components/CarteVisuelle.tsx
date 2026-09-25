import { RARETES, type Carte } from "@/lib/cartes";

export function CarteVisuelle({ carte, badge }: { carte: Carte; badge?: string }) {
  const rarete = RARETES[carte.rarete];

  return (
    <div className={`relative aspect-[5/7] w-full rounded-xl border p-1.5 ${rarete.classes}`}>
      {badge && (
        <span className="absolute -top-2.5 right-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-black">
          {badge}
        </span>
      )}
      {/* Cadre intérieur */}
      <div className="flex h-full flex-col items-center rounded-lg border border-white/10 px-2.5 pt-2.5 pb-3 text-center">
        <p className={`text-[9px] font-semibold tracking-[0.2em] uppercase ${rarete.texte}`}>
          {rarete.label}
        </p>
        {carte.visuel === "blason" ? (
          // Ville : blason aux couleurs de sa région, avec le numéro du département
          <div
            className="my-2 flex w-full flex-1 items-center justify-center rounded-md"
            style={{ background: `radial-gradient(closest-side, ${carte.couleur}88, transparent)` }}
          >
            <div
              className="blason flex aspect-[5/6] w-1/2 flex-col items-center overflow-hidden border-2 border-white/80 font-display drop-shadow-lg"
              style={{ background: carte.couleur, color: carte.couleurTexte }}
            >
              <div className="flex h-1.5 w-full">
                <span className="flex-1 bg-[#1d4ed8]" />
                <span className="flex-1 bg-white" />
                <span className="flex-1 bg-[#dc2626]" />
              </div>
              <span className="mt-2 text-[8px] font-bold tracking-widest opacity-80">DÉP.</span>
              <span className="text-2xl leading-none font-black sm:text-3xl">{carte.sigle}</span>
            </div>
          </div>
        ) : carte.couleur ? (
          // Joueur : maillot aux couleurs de son équipe
          <div
            className="my-2 flex w-full flex-1 items-center justify-center rounded-md"
            style={{ background: `radial-gradient(closest-side, ${carte.couleur}66, transparent)` }}
          >
            <div
              className="maillot flex aspect-[5/6] w-3/5 flex-col items-center justify-center pt-3 font-display drop-shadow-lg"
              style={{ background: carte.couleur, color: carte.couleurTexte }}
            >
              <span className="text-[9px] font-bold tracking-widest opacity-80">{carte.sigle}</span>
              <span className="text-3xl leading-none font-black sm:text-4xl">{carte.numero || "–"}</span>
            </div>
          </div>
        ) : (
          <div className="my-2 flex w-full flex-1 items-center justify-center rounded-md bg-[radial-gradient(closest-side,rgb(255_255_255/0.07),transparent)] text-5xl drop-shadow-[0_6px_10px_rgb(0_0_0/0.6)] sm:text-6xl">
            {carte.emoji}
          </div>
        )}
        <p className="font-display text-base leading-tight font-semibold text-white">{carte.nom}</p>
        {carte.equipe && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-white/60">
            {carte.visuel === "blason" ? carte.poste : `${carte.equipe} · ${carte.poste}`}
          </p>
        )}
        <div className={`my-1.5 h-px w-8 bg-current opacity-50 ${rarete.texte}`} />
        <p className="text-[10px] leading-snug text-white/50">{carte.description}</p>
      </div>
    </div>
  );
}

export function DosDeCarte() {
  return (
    <div className="dos-motif flex aspect-[5/7] w-full items-center justify-center rounded-xl border border-accent/40 p-1.5 shadow-lg shadow-black/50">
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-accent/20">
        <div className="flex size-14 items-center justify-center rounded-full border-2 border-accent/70 bg-panneau font-display text-2xl font-bold text-accent">
          P
        </div>
      </div>
    </div>
  );
}
