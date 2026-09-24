import { OuvreurDePack } from "@/components/OuvreurDePack";
import { ErreurCartes } from "@/components/ErreurCartes";
import { chargerCartes } from "@/lib/supabase";

export const dynamic = "force-dynamic"; // cartes toujours à jour

export default async function Accueil() {
  const { cartes, erreur } = await chargerCartes();
  if (erreur) return <ErreurCartes message={erreur} />;

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="font-display text-4xl font-bold">Ouvrir un paquet</h1>
      <OuvreurDePack cartesMaison={cartes} />
    </div>
  );
}
