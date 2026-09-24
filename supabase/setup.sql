-- À coller dans Supabase > SQL Editor > Run

create table if not exists messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  contenu text not null
);

alter table messages enable row level security;

-- Tout le monde peut lire (mais pas écrire)
create policy "lecture publique" on messages
  for select using (true);

-- Données de test
insert into messages (contenu) values
  ('Bonjour depuis Supabase !'),
  ('Mon site fonctionne avec Next.js + Vercel');
