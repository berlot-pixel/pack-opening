import { OuvreurDePack } from "@/components/OuvreurDePack";
import { ErreurCartes } from "@/components/ErreurCartes";
import { chargerCartes } from "@/lib/supabase";

export const dynamic = "force-dynamic"; // cartes toujours à jour

export default async function Accueil() {
  const { cartes, erreur } = await chargerCartes();
  if (erreur) return <ErreurCartes message={erreur} />;

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="text-center">
        <p className="mb-3 text-[11px] tracking-[0.35em] text-or uppercase">Édition Maison</p>
        <h1 className="font-serif text-5xl font-normal text-ivoire sm:text-6xl">
          Ouvre un <span className="text-or-clair italic">booster</span>
        </h1>
        <p className="mt-4 text-sm text-white/50">
          {cartes.length} objets du quotidien à collectionner, de la Commune à l&apos;Ultra rare.
        </p>
      </div>
      <OuvreurDePack cartes={cartes} />
    </div>
  );
}
