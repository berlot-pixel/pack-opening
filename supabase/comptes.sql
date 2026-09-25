-- À coller dans Supabase > SQL Editor > Run
-- Comptes joueurs (pseudo) et amis

-- ---------- Profils : le pseudo de chaque compte ----------
create table if not exists profils (
  id uuid primary key references auth.users on delete cascade,
  pseudo text not null check (pseudo ~ '^[A-Za-z0-9_.-]{3,20}$'),
  cree_le timestamptz not null default now()
);

-- Deux joueurs ne peuvent pas avoir le même pseudo, même avec des majuscules différentes
create unique index if not exists profils_pseudo_unique on profils (lower(pseudo));

alter table profils enable row level security;

-- Les joueurs connectés peuvent voir les pseudos (pour ajouter des amis)
create policy "profils visibles par les joueurs connectés" on profils
  for select to authenticated using (true);

-- Le profil est créé automatiquement à l'inscription, avec le pseudo choisi
create or replace function creer_profil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profils (id, pseudo) values (new.id, new.raw_user_meta_data ->> 'pseudo');
  return new;
end;
$$;

drop trigger if exists a_l_inscription on auth.users;
create trigger a_l_inscription
  after insert on auth.users
  for each row execute function creer_profil();

-- Vérifier qu'un pseudo est libre avant de s'inscrire (utilisable sans être connecté)
create or replace function pseudo_disponible(p_pseudo text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not exists (select 1 from profils where lower(pseudo) = lower(p_pseudo));
$$;

grant execute on function pseudo_disponible(text) to anon, authenticated;

-- ---------- Amitiés : demandes envoyées puis acceptées ----------
create table if not exists amities (
  demandeur uuid not null references profils (id) on delete cascade,
  destinataire uuid not null references profils (id) on delete cascade,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'acceptee')),
  cree_le timestamptz not null default now(),
  primary key (demandeur, destinataire),
  check (demandeur <> destinataire)
);

-- Une seule relation par paire de joueurs, quel que soit celui qui a demandé
create unique index if not exists amities_paire_unique
  on amities (least(demandeur, destinataire), greatest(demandeur, destinataire));

alter table amities enable row level security;

-- Chacun ne voit que les demandes et amitiés qui le concernent
create policy "voir ses amitiés" on amities
  for select to authenticated using (auth.uid() in (demandeur, destinataire));

-- On ne peut envoyer une demande qu'en son propre nom
create policy "envoyer une demande" on amities
  for insert to authenticated with check (auth.uid() = demandeur and statut = 'en_attente');

-- Seul le destinataire peut accepter
create policy "accepter une demande" on amities
  for update to authenticated
  using (auth.uid() = destinataire)
  with check (auth.uid() = destinataire and statut = 'acceptee');

-- Chacun des deux peut refuser, annuler ou retirer l'amitié
create policy "supprimer une amitié" on amities
  for delete to authenticated using (auth.uid() in (demandeur, destinataire));
