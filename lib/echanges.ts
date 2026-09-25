import type { Profil } from "./compte";
import { supabase } from "./supabase";

export type StatutEchange = "en_attente" | "acceptee" | "refusee" | "annulee";

export type Echange = {
  id: number;
  proposeur: Profil;
  destinataire: Profil;
  donne: number[]; // cartes données par le proposeur (une case par exemplaire)
  demande: number[]; // cartes demandées au destinataire
  statut: StatutEchange;
  cree_le: string;
};

const SANS_SUPABASE = { erreur: "Le site n'est pas relié à Supabase." };

// Messages d'erreur des fonctions SQL, sans le jargon technique
function message(erreur: { message: string; code?: string }) {
  if (erreur.code === "PGRST202" || erreur.message.includes("schema cache"))
    return "Les échanges ne sont pas encore activés (script supabase/echanges.sql).";
  return erreur.message;
}

export async function chargerEchanges(): Promise<{ echanges: Echange[]; erreur?: string }> {
  if (!supabase) return { echanges: [], ...SANS_SUPABASE };
  const { data, error } = await supabase
    .from("echanges")
    .select(
      "id, donne, demande, statut, cree_le, proposeur:profils!echanges_proposeur_fkey(id, pseudo), destinataire:profils!echanges_destinataire_fkey(id, pseudo)",
    )
    .order("cree_le", { ascending: false })
    .limit(50)
    .returns<Echange[]>();
  if (error) return { echanges: [], erreur: message(error) };
  return { echanges: data };
}

// Cartes d'un ami : { id de carte: nombre d'exemplaires }
export async function chargerCollectionDe(joueur: string): Promise<Record<number, number>> {
  if (!supabase) return {};
  const { data } = await supabase
    .from("collections")
    .select("carte_id, nombre")
    .eq("joueur", joueur)
    .returns<{ carte_id: number; nombre: number }[]>();
  return Object.fromEntries((data ?? []).map((l) => [l.carte_id, l.nombre]));
}

async function appeler(nom: string, parametres: Record<string, unknown>): Promise<{ erreur?: string }> {
  if (!supabase) return SANS_SUPABASE;
  const { error } = await supabase.rpc(nom, parametres);
  return error ? { erreur: message(error) } : {};
}

export const proposerEchange = (destinataire: string, donne: number[], demande: number[]) =>
  appeler("proposer_echange", { p_destinataire: destinataire, p_donne: donne, p_demande: demande });

export const accepterEchange = (id: number) => appeler("accepter_echange", { p_id: id });

// Refuser (si on l'a reçu) ou annuler (si on l'a proposé)
export const annulerEchange = (id: number) => appeler("annuler_echange", { p_id: id });
