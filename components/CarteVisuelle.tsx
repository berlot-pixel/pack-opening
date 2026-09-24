import { RARETES, type Carte } from "@/lib/cartes";

export function CarteVisuelle({ carte, badge }: { carte: Carte; badge?: string }) {
  const rarete = RARETES[carte.rarete];

  return (
    <div className={`relative aspect-[5/7] w-full rounded-lg border p-1.5 ${rarete.classes}`}>
      {badge && (
        <span className="absolute -top-2.5 right-2 z-10 rounded-full border border-or/70 bg-[#0c0b0a] px-2 py-0.5 text-[9px] font-medium tracking-[0.2em] text-or-clair uppercase">
          {badge}
        </span>
      )}
      {/* Cadre intérieur */}
      <div className="flex h-full flex-col items-center rounded-[5px] border border-white/10 px-2.5 pt-2.5 pb-3 text-center">
        <p className={`text-[9px] tracking-[0.3em] uppercase ${rarete.texte}`}>{rarete.label}</p>
        <div className="my-2 flex w-full flex-1 items-center justify-center rounded-sm bg-[radial-gradient(closest-side,rgb(255_255_255/0.07),transparent)] text-5xl drop-shadow-[0_6px_10px_rgb(0_0_0/0.6)] sm:text-6xl">
          {carte.emoji}
        </div>
        <p className="font-serif text-lg leading-tight font-medium text-ivoire">{carte.nom}</p>
        <div className={`my-1.5 h-px w-8 bg-current opacity-50 ${rarete.texte}`} />
        <p className="text-[10px] leading-snug text-white/50">{carte.description}</p>
      </div>
    </div>
  );
}

export function DosDeCarte() {
  return (
    <div className="dos-motif flex aspect-[5/7] w-full items-center justify-center rounded-lg border border-or/50 p-1.5 shadow-lg shadow-black/50">
      <div className="flex h-full w-full items-center justify-center rounded-[5px] border border-or/25">
        <div className="flex size-14 items-center justify-center rounded-full border border-or/60 bg-[#0c0b0a] font-serif text-2xl text-or italic">
          P
        </div>
      </div>
    </div>
  );
}
