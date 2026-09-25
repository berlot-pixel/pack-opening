-- À coller dans Supabase > SQL Editor > Run
-- Pack Wikipédia : les cartes sont des pages tirées au hasard, il n'y a pas de liste fixe.
-- Chaque page découverte par un joueur est mémorisée ici pour que tout le monde puisse l'afficher
-- (dans sa collection, et dans les échanges entre amis).

create table if not exists cartes_wiki (
  id bigint primary key check (id >= 1000000000 and id < 2000000000),
  carte jsonb not null,
  cree_le timestamptz not null default now()
);

alter table cartes_wiki enable row level security;

create policy "voir les pages découvertes" on cartes_wiki
  for select to authenticated using (true);

-- Une page déjà découverte n'est jamais modifiée (on ignore les doublons)
create policy "ajouter une page découverte" on cartes_wiki
  for insert to authenticated with check (true);
