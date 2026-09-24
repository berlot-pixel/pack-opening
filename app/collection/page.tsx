import { Collection } from "@/components/Collection";
import { ErreurCartes } from "@/components/ErreurCartes";
import { chargerCartes } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PageCollection() {
  const { cartes, erreur } = await chargerCartes();
  if (erreur) return <ErreurCartes message={erreur} />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-black">Ma collection</h1>
      <Collection cartes={cartes} />
    </div>
  );
}
