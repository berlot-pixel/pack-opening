export function ErreurCartes({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-400/40 bg-red-950/40 p-6">
      <h1 className="mb-2 text-xl font-bold">Impossible de charger les cartes</h1>
      <p className="mb-4 text-white/80">{message}</p>
      <p className="text-sm text-white/60">
        As-tu lancé le script <code>supabase/cartes.sql</code> dans Supabase → SQL Editor ?
      </p>
    </div>
  );
}
