import { Collection } from "@/components/Collection";
import { ErreurCartes } from "@/components/ErreurCartes";
import { chargerCartes } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function PageCollection() {
  const { cartes, erreur } = await chargerCartes();
  if (erreur) return <ErreurCartes message={erreur} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-3 text-[11px] tracking-[0.35em] text-or uppercase">Édition Maison</p>
        <h1 className="font-serif text-5xl font-normal text-ivoire">
          Ma <span className="text-or-clair italic">collection</span>
        </h1>
      </div>
      <Collection cartes={cartes} />
    </div>
  );
}
