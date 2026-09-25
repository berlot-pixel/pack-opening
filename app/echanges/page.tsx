import type { Metadata } from "next";
import { Echanges } from "@/components/Echanges";
import { ErreurCartes } from "@/components/ErreurCartes";
import { chargerCartes } from "@/lib/supabase";

export const metadata: Metadata = { title: "Échanges — Pack Opening" };
export const dynamic = "force-dynamic";

export default async function PageEchanges() {
  const { cartes, erreur } = await chargerCartes();
  if (erreur) return <ErreurCartes message={erreur} />;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Échanges</h1>
        <p className="mt-2 text-sm text-white/60">Échange tes cartes avec tes amis</p>
      </div>
      <Echanges cartesMaison={cartes} />
    </div>
  );
}
