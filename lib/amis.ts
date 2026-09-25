import type { Profil } from "./compte";
import { supabase } from "./supabase";

export type Relation = {
  ami: Profil;
  acceptee: boolean;
  envoyeeParMoi: boolean; // true : c'est moi qui ai fait la demande
};

type LigneAmitie = {
  demandeur: string;
  destinataire: string;
  statut: "en_attente" | "acceptee";
  profil_demandeur: Profil;
  profil_destinataire: Profil;
};

export async function chargerRelations(monId: string): Promise<{ relations: Relation[]; erreur?: string }> {
  if (!supabase) return { relations: [] };
  const { data, error } = await supabase
    .from("amities")
    .select(
      "demandeur, destinataire, statut, profil_demandeur:profils!amities_demandeur_fkey(id, pseudo), profil_destinataire:profils!amities_destinataire_fkey(id, pseudo)",
    )
    .order("cree_le", { ascending: false })
    .returns<LigneAmitie[]>();
  if (error) return { relations: [], erreur: error.message };

  const relations = data.map((ligne) => {
    const envoyeeParMoi = ligne.demandeur === monId;
    return {
      ami: envoyeeParMoi ? ligne.profil_destinataire : ligne.profil_demandeur,
      acceptee: ligne.statut === "acceptee",
      envoyeeParMoi,
    };
  });
  relations.sort((a, b) => a.ami.pseudo.localeCompare(b.ami.pseudo, "fr"));
  return { relations };
}

// Envoie une demande d'ami ; si l'autre joueur m'en avait déjà envoyé une, on l'accepte
export async function ajouterAmi(monId: string, pseudo: string): Promise<{ erreur?: string; message?: string }> {
  if (!supabase) return { erreur: "Le site n'est pas relié à Supabase." };
  const recherche = pseudo.trim();
  if (!recherche) return { erreur: "Écris le pseudo de ton ami." };

  // ilike = sans tenir compte des majuscules ; on échappe _ et % qui sont des jokers
  const { data: joueur } = await supabase
    .from("profils")
    .select("id, pseudo")
    .ilike("pseudo", recherche.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle<Profil>();
  if (!joueur) return { erreur: `Aucun joueur ne s'appelle « ${recherche} ».` };
  if (joueur.id === monId) return { erreur: "C'est ton propre pseudo !" };

  const { data: existante } = await supabase
    .from("amities")
    .select("demandeur, statut")
    .or(
      `and(demandeur.eq.${monId},destinataire.eq.${joueur.id}),and(demandeur.eq.${joueur.id},destinataire.eq.${monId})`,
    )
    .maybeSingle<{ demandeur: string; statut: string }>();

  if (existante?.statut === "acceptee") return { erreur: `${joueur.pseudo} est déjà ton ami.` };
  if (existante?.demandeur === monId) return { erreur: `Demande déjà envoyée à ${joueur.pseudo}.` };
  if (existante) {
    const { erreur } = await accepterDemande(joueur.id, monId);
    return erreur ? { erreur } : { message: `${joueur.pseudo} et toi êtes maintenant amis !` };
  }

  const { error } = await supabase.from("amities").insert({ demandeur: monId, destinataire: joueur.id });
  if (error) return { erreur: error.message };
  return { message: `Demande envoyée à ${joueur.pseudo}.` };
}

export async function accepterDemande(demandeur: string, monId: string) {
  if (!supabase) return {};
  const { error } = await supabase
    .from("amities")
    .update({ statut: "acceptee" })
    .eq("demandeur", demandeur)
    .eq("destinataire", monId);
  return error ? { erreur: error.message } : {};
}

// Refuser une demande, annuler la sienne ou retirer un ami
export async function supprimerRelation(monId: string, autreId: string) {
  if (!supabase) return {};
  const { error } = await supabase
    .from("amities")
    .delete()
    .or(
      `and(demandeur.eq.${monId},destinataire.eq.${autreId}),and(demandeur.eq.${autreId},destinataire.eq.${monId})`,
    );
  return error ? { erreur: error.message } : {};
}
