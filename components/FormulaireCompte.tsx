"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { connecter, deconnecter, inscrire, useCompte } from "@/lib/compte";

type Mode = "connexion" | "inscription";

const CHAMP =
  "w-full rounded-xl border border-bordure bg-surface px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-accent";

export function FormulaireCompte() {
  const { chargement, session, profil } = useCompte();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("connexion");
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [mailEnvoye, setMailEnvoye] = useState(false);

  async function valider(e: FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    if (mode === "inscription") {
      const resultat = await inscrire(pseudo.trim(), email.trim(), motDePasse);
      if (resultat.erreur) setErreur(resultat.erreur);
      else if (resultat.confirmationMail) setMailEnvoye(true);
      else router.push("/");
    } else {
      const resultat = await connecter(email.trim(), motDePasse);
      if (resultat.erreur) setErreur(resultat.erreur);
      else router.push("/");
    }
    setEnvoi(false);
  }

  if (chargement) return <div className="h-80 w-full max-w-sm animate-pulse rounded-2xl bg-panneau" />;

  if (session) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-bordure bg-panneau p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 font-display text-2xl font-bold text-accent">
          {profil?.pseudo[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-white/70">
          Connecté en tant que <strong className="text-white">{profil?.pseudo ?? session.user.email}</strong>
        </p>
        <Link
          href="/amis"
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-black transition hover:brightness-110"
        >
          Voir mes amis
        </Link>
        <button
          onClick={() => deconnecter()}
          className="cursor-pointer text-sm text-white/50 transition hover:text-red-300"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  if (mailEnvoye) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-bordure bg-panneau p-8 text-center">
        <p className="text-4xl">📬</p>
        <h2 className="font-display text-xl font-bold">Vérifie tes mails</h2>
        <p className="text-sm text-white/60">
          On t&apos;a envoyé un lien à <strong className="text-white">{email}</strong>. Clique dessus pour activer ton
          compte, puis reviens te connecter.
        </p>
        <button
          onClick={() => {
            setMailEnvoye(false);
            setMode("connexion");
          }}
          className="mt-2 cursor-pointer text-sm font-semibold text-accent"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={valider}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-bordure bg-panneau p-6"
    >
      <div className="flex gap-1 rounded-xl bg-surface p-1">
        {(["connexion", "inscription"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setErreur("");
            }}
            className={`flex-1 cursor-pointer rounded-lg py-2 font-display text-sm font-bold transition ${
              mode === m ? "bg-accent/15 text-accent" : "text-white/60 hover:text-white"
            }`}
          >
            {m === "connexion" ? "Se connecter" : "Créer un compte"}
          </button>
        ))}
      </div>

      {mode === "inscription" && (
        <label className="flex flex-col gap-1.5 text-sm text-white/70">
          Pseudo
          <input
            className={CHAMP}
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="3 à 20 caractères"
            autoComplete="username"
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_.\-]{3,20}"
            title="Lettres, chiffres, _ . ou - (3 à 20 caractères)"
            required
          />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-sm text-white/70">
        Adresse mail
        <input
          className={CHAMP}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="toi@exemple.fr"
          autoComplete="email"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-white/70">
        Mot de passe
        <input
          className={CHAMP}
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder={mode === "inscription" ? "6 caractères minimum" : ""}
          autoComplete={mode === "inscription" ? "new-password" : "current-password"}
          minLength={6}
          required
        />
      </label>

      {erreur && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{erreur}</p>}

      <button
        type="submit"
        disabled={envoi}
        className="cursor-pointer rounded-xl bg-accent px-5 py-3 font-display font-bold text-black transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      >
        {envoi ? "Un instant…" : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
      </button>
    </form>
  );
}
