import type { Metadata } from "next";
import { FormulaireCompte } from "@/components/FormulaireCompte";

export const metadata: Metadata = { title: "Compte — Pack Opening" };

export default function PageConnexion() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Mon compte</h1>
        <p className="mt-2 text-sm text-white/60">Crée ton compte pour ajouter tes amis</p>
      </div>
      <FormulaireCompte />
    </div>
  );
}
