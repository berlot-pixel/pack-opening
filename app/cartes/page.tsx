import type { Metadata } from "next";
import { Catalogue } from "@/components/Catalogue";
import { ErreurCartes } from "@/components/ErreurCartes";
import { chargerCartes } from "@/lib/supabase";

export const metadata: Metadata = { title: "Toutes les cartes — Pack Opening" };
export const dynamic = "force-dynamic";

export default async function PageCartes() {
  const { cartes, erreur } = await chargerCartes();
  if (erreur) return <ErreurCartes message={erreur} />;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Toutes les cartes</h1>
        <p className="mt-2 text-sm text-white/60">Toutes les cartes à collectionner, extension par extension</p>
      </div>
      <Catalogue cartesMaison={cartes} />
    </div>
  );
}
