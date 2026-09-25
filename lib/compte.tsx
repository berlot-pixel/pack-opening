"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Profil = { id: string; pseudo: string };

type EtatCompte = { chargement: boolean; session: Session | null; profil: Profil | null };

const ContexteCompte = createContext<EtatCompte>({ chargement: true, session: null, profil: null });

// Suit le joueur connecté (session Supabase + son profil) pour tout le site
export function FournisseurCompte({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatCompte>({
    chargement: supabase !== null,
    session: null,
    profil: null,
  });

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let actif = true;

    async function appliquer(session: Session | null) {
      let profil: Profil | null = null;
      if (session) {
        const { data } = await client
          .from("profils")
          .select("id, pseudo")
          .eq("id", session.user.id)
          .maybeSingle<Profil>();
        profil = data;
      }
      if (actif) setEtat({ chargement: false, session, profil });
    }

    // Supabase conseille de ne pas l'appeler directement dans ce rappel : on attend un tour
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_evenement, session) => {
      setTimeout(() => appliquer(session), 0);
    });
    return () => {
      actif = false;
      subscription.unsubscribe();
    };
  }, []);

  return <ContexteCompte.Provider value={etat}>{children}</ContexteCompte.Provider>;
}

export const useCompte = () => useContext(ContexteCompte);

export const FORMAT_PSEUDO = /^[A-Za-z0-9_.-]{3,20}$/;

// Messages d'erreur de Supabase traduits pour les joueurs
function traduire(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Adresse mail ou mot de passe incorrect.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cette adresse mail.";
  if (m.includes("email not confirmed"))
    return "Confirme d'abord ton adresse mail avec le lien reçu par mail.";
  if (m.includes("password should be at least")) return "Le mot de passe doit faire au moins 6 caractères.";
  if (m.includes("rate limit")) return "Trop de tentatives en peu de temps, réessaie dans quelques minutes.";
  if (m.includes("invalid") && m.includes("email")) return "Cette adresse mail n'est pas valide.";
  if (m.includes("database error saving new user")) return "Ce pseudo vient d'être pris, choisis-en un autre.";
  return message;
}

const SANS_SUPABASE = "Le site n'est pas relié à Supabase.";

export async function inscrire(pseudo: string, email: string, motDePasse: string) {
  if (!supabase) return { erreur: SANS_SUPABASE };
  if (!FORMAT_PSEUDO.test(pseudo))
    return { erreur: "Le pseudo doit faire 3 à 20 caractères : lettres, chiffres, _ . ou -" };

  const { data: libre, error: erreurPseudo } = await supabase.rpc("pseudo_disponible", {
    p_pseudo: pseudo,
  });
  if (erreurPseudo) return { erreur: "Les comptes ne sont pas encore activés (script supabase/comptes.sql)." };
  if (!libre) return { erreur: "Ce pseudo est déjà pris." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { pseudo }, emailRedirectTo: window.location.origin },
  });
  if (error) return { erreur: traduire(error.message) };
  // Sans session, Supabase attend que le joueur confirme son adresse mail
  return { confirmationMail: !data.session };
}

export async function connecter(email: string, motDePasse: string) {
  if (!supabase) return { erreur: SANS_SUPABASE };
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  return error ? { erreur: traduire(error.message) } : {};
}

export async function deconnecter() {
  await supabase?.auth.signOut();
}
