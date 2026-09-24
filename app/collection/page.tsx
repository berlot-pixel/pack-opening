import { Collection } from "@/components/Collection";
import { ErreurCartes } from "@/components/ErreurCartes";
import { chargerCartes } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PageCollection() {
  const { cartes, erreur } = await chargerCartes();
  if (erreur) return <ErreurCartes message={erreur} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Collection</h1>
        <p className="mt-2 text-sm text-white/60">Revends tes cartes pour gagner des coins</p>
      </div>
      <Collection cartesMaison={cartes} />
    </div>
  );
}
