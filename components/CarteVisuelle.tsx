import { RARETES, type Carte } from "@/lib/cartes";

export function CarteVisuelle({ carte, badge }: { carte: Carte; badge?: string }) {
  const rarete = RARETES[carte.rarete];

  return (
    <div
      className={`relative flex aspect-[5/7] w-full flex-col items-center rounded-xl border-4 p-3 text-center ${rarete.classes}`}
    >
      {badge && (
        <span className="absolute -top-3 right-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
          {badge}
        </span>
      )}
      <p className={`text-[10px] font-semibold tracking-widest uppercase ${rarete.texte}`}>
        {rarete.label}
      </p>
      <div className="flex flex-1 items-center justify-center text-5xl drop-shadow-lg sm:text-6xl">
        {carte.emoji}
      </div>
      <p className="text-sm leading-tight font-bold text-white">{carte.nom}</p>
      <p className="mt-1 text-[11px] leading-snug text-white/70">{carte.description}</p>
    </div>
  );
}

export function DosDeCarte() {
  return (
    <div className="flex aspect-[5/7] w-full items-center justify-center rounded-xl border-4 border-indigo-300/60 bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700 shadow-lg">
      <span className="text-4xl opacity-80">🏠</span>
    </div>
  );
}
