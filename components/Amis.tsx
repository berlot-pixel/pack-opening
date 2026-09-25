"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { accepterDemande, ajouterAmi, chargerRelations, supprimerRelation, type Relation } from "@/lib/amis";
import { useCompte } from "@/lib/compte";

function Avatar({ pseudo }: { pseudo: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent">
      {pseudo[0]?.toUpperCase()}
    </span>
  );
}

const BOUTON_DISCRET =
  "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-red-500/10 hover:text-red-300";

export function Amis() {
  const { chargement, session, profil } = useCompte();
  const monId = profil?.id;
  const [relations, setRelations] = useState<Relation[] | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [retour, setRetour] = useState<{ erreur?: string; message?: string }>({});
  const [envoi, setEnvoi] = useState(false);

  const recharger = useCallback(async () => {
    if (!monId) return;
    const resultat = await chargerRelations(monId);
    setRelations(resultat.relations);
    if (resultat.erreur) setRetour({ erreur: resultat.erreur });
  }, [monId]);

  // Charge la liste, puis la met à jour quand on revient sur l'onglet
  useEffect(() => {
    if (!monId) return;
    let actif = true;
    chargerRelations(monId).then((resultat) => {
      if (!actif) return;
      setRelations(resultat.relations);
      if (resultat.erreur) setRetour({ erreur: resultat.erreur });
    });
    const auRetour = () => recharger();
    window.addEventListener("focus", auRetour);
    return () => {
      actif = false;
      window.removeEventListener("focus", auRetour);
    };
  }, [monId, recharger]);

  async function agir(action: Promise<{ erreur?: string; message?: string }>) {
    const resultat = await action;
    setRetour(resultat);
    await recharger();
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!monId) return;
    setEnvoi(true);
    await agir(ajouterAmi(monId, pseudo));
    setPseudo("");
    setEnvoi(false);
  }

  if (chargement) return <div className="h-60 w-full max-w-xl animate-pulse rounded-2xl bg-panneau" />;

  if (!session) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-bordure bg-panneau p-8 text-center">
        <p className="text-white/70">Connecte-toi pour ajouter tes amis par leur pseudo.</p>
        <Link
          href="/connexion"
          className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-black transition hover:brightness-110"
        >
          Se connecter ou créer un compte
        </Link>
      </div>
    );
  }

  if (!monId) {
    return (
      <p className="max-w-md rounded-2xl border border-red-400/30 bg-red-950/30 p-5 text-sm text-red-200">
        Ton profil est introuvable. As-tu lancé le script <code>supabase/comptes.sql</code> dans Supabase avant de
        créer ton compte ?
      </p>
    );
  }

  const recues = relations?.filter((r) => !r.acceptee && !r.envoyeeParMoi) ?? [];
  const envoyees = relations?.filter((r) => !r.acceptee && r.envoyeeParMoi) ?? [];
  const amis = relations?.filter((r) => r.acceptee) ?? [];

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <form onSubmit={envoyer} className="flex flex-col gap-3 rounded-2xl border border-bordure bg-panneau p-5">
        <label htmlFor="pseudo-ami" className="font-display font-bold">
          Ajouter un ami
        </label>
        <div className="flex gap-2">
          <input
            id="pseudo-ami"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Pseudo de ton ami"
            className="min-w-0 flex-1 rounded-xl border border-bordure bg-surface px-4 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-accent"
            required
          />
          <button
            type="submit"
            disabled={envoi}
            className="cursor-pointer rounded-xl bg-accent px-5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-60"
          >
            Ajouter
          </button>
        </div>
        {retour.erreur && <p className="text-sm text-red-300">{retour.erreur}</p>}
        {retour.message && <p className="text-sm text-accent">{retour.message}</p>}
        <p className="text-xs text-white/40">
          Ton pseudo : <strong className="text-white/70">{profil?.pseudo}</strong> — donne-le à tes amis
        </p>
      </form>

      {recues.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-bold">
            Demandes reçues <span className="text-accent">{recues.length}</span>
          </h2>
          {recues.map(({ ami }) => (
            <div key={ami.id} className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
              <Avatar pseudo={ami.pseudo} />
              <span className="flex-1 font-semibold">{ami.pseudo}</span>
              <button
                onClick={() => agir(accepterDemande(ami.id, monId).then((r) => r.erreur ? r : { message: `${ami.pseudo} est maintenant ton ami !` }))}
                className="cursor-pointer rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-black transition hover:brightness-110"
              >
                Accepter
              </button>
              <button onClick={() => agir(supprimerRelation(monId, ami.id))} className={BOUTON_DISCRET}>
                Refuser
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">
          Mes amis <span className="text-white/40">{amis.length}</span>
        </h2>
        {relations === null ? (
          <div className="h-14 animate-pulse rounded-xl bg-panneau" />
        ) : amis.length === 0 ? (
          <p className="rounded-xl border border-dashed border-bordure p-5 text-center text-sm text-white/50">
            Pas encore d&apos;amis. Ajoute-les avec leur pseudo !
          </p>
        ) : (
          amis.map(({ ami }) => (
            <div key={ami.id} className="flex items-center gap-3 rounded-xl border border-bordure bg-panneau p-3">
              <Avatar pseudo={ami.pseudo} />
              <span className="flex-1 font-semibold">{ami.pseudo}</span>
              <button onClick={() => agir(supprimerRelation(monId, ami.id))} className={BOUTON_DISCRET}>
                Retirer
              </button>
            </div>
          ))
        )}
      </section>

      {envoyees.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-bold text-white/60">Demandes envoyées</h2>
          {envoyees.map(({ ami }) => (
            <div key={ami.id} className="flex items-center gap-3 rounded-xl border border-bordure bg-panneau/60 p-3">
              <Avatar pseudo={ami.pseudo} />
              <span className="flex-1 text-white/70">{ami.pseudo}</span>
              <span className="text-xs text-white/40">en attente</span>
              <button onClick={() => agir(supprimerRelation(monId, ami.id))} className={BOUTON_DISCRET}>
                Annuler
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
