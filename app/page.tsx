import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic"; // données toujours fraîches

type Message = { id: number; created_at: string; contenu: string };

export default async function Home() {
  if (!supabase) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-4 text-2xl font-bold">Configuration manquante</h1>
        <p>
          Renseigne <code>NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans <code>.env.local</code>, puis relance{" "}
          <code>npm run dev</code>.
        </p>
      </main>
    );
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Message[]>();

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Mes messages</h1>

      {error && <p className="text-red-600">Erreur : {error.message}</p>}

      {messages?.length === 0 && <p>Aucun message pour l&apos;instant.</p>}

      <ul className="space-y-3">
        {messages?.map((m) => (
          <li key={m.id} className="rounded-lg border p-4">
            <p>{m.contenu}</p>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(m.created_at).toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
