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
        <h1 className="text-4xl font-black sm:text-5xl">Ouvre un booster</h1>
        <p className="mt-2 text-white/70">
          {cartes.length} objets du quotidien à collectionner, de Commune à Ultra rare.
        </p>
      </div>
      <OuvreurDePack cartes={cartes} />
    </div>
  );
}
