import { createClient } from "@supabase/supabase-js";
import type { Carte } from "./cartes";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// null tant que les variables d'environnement ne sont pas renseignées
export const supabase = url && key ? createClient(url, key) : null;

export async function chargerCartes(): Promise<{ cartes: Carte[]; erreur: string | null }> {
  if (!supabase) return { cartes: [], erreur: "Variables Supabase manquantes (.env.local)." };

  const { data, error } = await supabase.from("cartes").select("*").order("id").returns<Carte[]>();
  if (error) return { cartes: [], erreur: error.message };
  if (!data?.length) return { cartes: [], erreur: "La table « cartes » est vide." };
  return { cartes: data, erreur: null };
}
