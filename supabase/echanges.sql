-- À coller dans Supabase > SQL Editor > Run (après comptes.sql)
-- Collection enregistrée dans le compte, et échanges de cartes entre amis.
-- Les joueurs ne modifient jamais leurs cartes directement : tout passe par les fonctions
-- ci-dessous, qui vérifient ce qu'on possède et déplacent les cartes d'un seul coup.

-- ---------- Coins, paquets ouverts et stock de paquets de chaque joueur ----------
create table if not exists joueurs (
  id uuid primary key references profils (id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  packs integer not null default 0,
  stock integer not null default 10,
  maj_stock timestamptz not null default now()
);
alter table joueurs enable row level security;
create policy "voir ses coins" on joueurs for select to authenticated using (id = auth.uid());

-- ---------- Cartes possédées ----------
create table if not exists collections (
  joueur uuid not null references profils (id) on delete cascade,
  carte_id bigint not null,
  nombre integer not null check (nombre >= 0),
  primary key (joueur, carte_id)
);
alter table collections enable row level security;

create or replace function sont_amis(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from amities
    where statut = 'acceptee'
      and ((demandeur = a and destinataire = b) or (demandeur = b and destinataire = a))
  );
$$;

-- On voit sa collection et celle de ses amis (pour choisir quoi échanger)
create policy "voir sa collection et celle de ses amis" on collections
  for select to authenticated using (joueur = auth.uid() or sont_amis(auth.uid(), joueur));

-- ---------- Échanges ----------
create table if not exists echanges (
  id bigint generated always as identity primary key,
  proposeur uuid not null references profils (id) on delete cascade,
  destinataire uuid not null references profils (id) on delete cascade,
  donne bigint[] not null default '{}', -- cartes données par le proposeur (une case par exemplaire)
  demande bigint[] not null default '{}', -- cartes demandées au destinataire
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'acceptee', 'refusee', 'annulee')),
  cree_le timestamptz not null default now(),
  repondu_le timestamptz
);
alter table echanges enable row level security;
create policy "voir ses échanges" on echanges
  for select to authenticated using (auth.uid() in (proposeur, destinataire));

-- ---------- Outils internes (pas appelables depuis le site) ----------
create or replace function assurer_joueur(j uuid)
returns void
language sql security definer set search_path = public
as $$
  insert into joueurs (id) values (j) on conflict (id) do nothing;
$$;

-- Le joueur possède-t-il toutes ces cartes (en comptant les exemplaires) ?
create or replace function possede(j uuid, cartes bigint[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select not exists (
    select 1
    from (select c, count(*) as n from unnest(cartes) as c group by c) as voulu
    left join collections col on col.joueur = j and col.carte_id = voulu.c
    where coalesce(col.nombre, 0) < voulu.n
  );
$$;

create or replace function ajouter_cartes(j uuid, cartes bigint[])
returns void
language sql security definer set search_path = public
as $$
  insert into collections (joueur, carte_id, nombre)
  select j, c, count(*)::int from unnest(cartes) as c group by c
  on conflict (joueur, carte_id) do update set nombre = collections.nombre + excluded.nombre;
$$;

create or replace function retirer_cartes(j uuid, cartes bigint[])
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update collections col set nombre = col.nombre - voulu.n
  from (select c, count(*)::int as n from unnest(cartes) as c group by c) as voulu
  where col.joueur = j and col.carte_id = voulu.c;
  delete from collections where joueur = j and nombre = 0;
end;
$$;

revoke execute on function assurer_joueur(uuid) from public, anon, authenticated;
revoke execute on function possede(uuid, bigint[]) from public, anon, authenticated;
revoke execute on function ajouter_cartes(uuid, bigint[]) from public, anon, authenticated;
revoke execute on function retirer_cartes(uuid, bigint[]) from public, anon, authenticated;
revoke execute on function sont_amis(uuid, uuid) from public, anon;

-- ---------- Fonctions utilisées par le site ----------

-- 1re connexion : on reprend la collection qui était dans le navigateur
create or replace function importer_collection(p_cartes jsonb, p_coins int, p_packs int, p_stock int, p_maj_stock timestamptz)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  moi uuid := auth.uid();
begin
  if moi is null then raise exception 'Connecte-toi d''abord'; end if;
  if exists (select 1 from joueurs where id = moi) then return; end if;
  insert into joueurs (id, coins, packs, stock, maj_stock)
  values (moi, greatest(p_coins, 0), greatest(p_packs, 0), least(greatest(p_stock, 0), 10), least(p_maj_stock, now()));
  insert into collections (joueur, carte_id, nombre)
  select moi, cle::bigint, valeur::int from jsonb_each_text(p_cartes) as t(cle, valeur) where valeur::int > 0;
end;
$$;

-- Ouvrir un paquet : vérifie le stock (1 paquet toutes les 5 minutes, 10 max) et ajoute les cartes
create or replace function ouvrir_paquet(p_cartes bigint[])
returns void
language plpgsql security definer set search_path = public
as $$
declare
  moi uuid := auth.uid();
  j joueurs;
  recharges int;
  disponibles int;
  depuis timestamptz;
begin
  if moi is null then raise exception 'Connecte-toi d''abord'; end if;
  if coalesce(array_length(p_cartes, 1), 0) <> 5 then raise exception 'Un paquet contient 5 cartes'; end if;
  perform assurer_joueur(moi);
  select * into j from joueurs where id = moi for update;

  if j.stock >= 10 then
    disponibles := 10;
    depuis := now();
  else
    recharges := floor(extract(epoch from now() - j.maj_stock) / 300);
    disponibles := least(10, j.stock + recharges);
    depuis := case when disponibles >= 10 then now() else j.maj_stock + recharges * interval '5 minutes' end;
  end if;
  if disponibles < 1 then raise exception 'Plus de paquets disponibles'; end if;

  update joueurs set stock = disponibles - 1, maj_stock = depuis, packs = packs + 1 where id = moi;
  perform ajouter_cartes(moi, p_cartes);
end;
$$;

-- Vendre des cartes : [{ "carte": id, "nombre": n, "prix": coins par carte }]
create or replace function vendre(p_ventes jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  moi uuid := auth.uid();
  v record;
  gain int := 0;
begin
  if moi is null then raise exception 'Connecte-toi d''abord'; end if;
  perform assurer_joueur(moi);
  for v in select * from jsonb_to_recordset(p_ventes) as x(carte bigint, nombre int, prix int) loop
    if v.nombre < 1 then continue; end if;
    update collections set nombre = nombre - v.nombre
    where joueur = moi and carte_id = v.carte and nombre >= v.nombre;
    if not found then raise exception 'Tu n''as pas assez d''exemplaires de cette carte'; end if;
    gain := gain + v.nombre * least(greatest(v.prix, 0), 400);
  end loop;
  delete from collections where joueur = moi and nombre = 0;
  update joueurs set coins = coins + gain where id = moi;
end;
$$;

create or replace function proposer_echange(p_destinataire uuid, p_donne bigint[], p_demande bigint[])
returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  moi uuid := auth.uid();
  nouvel_id bigint;
begin
  if moi is null then raise exception 'Connecte-toi d''abord'; end if;
  if not sont_amis(moi, p_destinataire) then raise exception 'Vous n''êtes pas amis'; end if;
  if coalesce(array_length(p_donne, 1), 0) + coalesce(array_length(p_demande, 1), 0) = 0 then
    raise exception 'Choisis au moins une carte';
  end if;
  if not possede(moi, p_donne) then raise exception 'Tu n''as pas toutes les cartes que tu proposes'; end if;
  if not possede(p_destinataire, p_demande) then raise exception 'Ton ami n''a plus toutes ces cartes'; end if;
  insert into echanges (proposeur, destinataire, donne, demande)
  values (moi, p_destinataire, coalesce(p_donne, '{}'), coalesce(p_demande, '{}'))
  returning id into nouvel_id;
  return nouvel_id;
end;
$$;

-- Accepter : on revérifie que chacun a encore ses cartes, puis on échange tout d'un coup
create or replace function accepter_echange(p_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  moi uuid := auth.uid();
  e echanges;
begin
  select * into e from echanges where id = p_id for update;
  if e.id is null or e.destinataire <> moi then raise exception 'Échange introuvable'; end if;
  if e.statut <> 'en_attente' then raise exception 'Cet échange n''est plus en attente'; end if;
  if not possede(e.proposeur, e.donne) then raise exception 'Ton ami n''a plus les cartes proposées'; end if;
  if not possede(moi, e.demande) then raise exception 'Tu n''as plus les cartes demandées'; end if;

  perform retirer_cartes(e.proposeur, e.donne);
  perform retirer_cartes(moi, e.demande);
  perform ajouter_cartes(moi, e.donne);
  perform ajouter_cartes(e.proposeur, e.demande);
  update echanges set statut = 'acceptee', repondu_le = now() where id = p_id;
end;
$$;

-- Refuser (destinataire) ou annuler (proposeur)
create or replace function annuler_echange(p_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  moi uuid := auth.uid();
  e echanges;
begin
  select * into e from echanges where id = p_id for update;
  if e.id is null or moi not in (e.proposeur, e.destinataire) then raise exception 'Échange introuvable'; end if;
  if e.statut <> 'en_attente' then raise exception 'Cet échange n''est plus en attente'; end if;
  update echanges
  set statut = case when moi = e.destinataire then 'refusee' else 'annulee' end, repondu_le = now()
  where id = p_id;
end;
$$;

grant execute on function importer_collection(jsonb, int, int, int, timestamptz) to authenticated;
grant execute on function ouvrir_paquet(bigint[]) to authenticated;
grant execute on function vendre(jsonb) to authenticated;
grant execute on function proposer_echange(uuid, bigint[], bigint[]) to authenticated;
grant execute on function accepter_echange(bigint) to authenticated;
grant execute on function annuler_echange(bigint) to authenticated;
revoke execute on function importer_collection(jsonb, int, int, int, timestamptz) from public, anon;
revoke execute on function ouvrir_paquet(bigint[]) from public, anon;
revoke execute on function vendre(jsonb) from public, anon;
revoke execute on function proposer_echange(uuid, bigint[], bigint[]) from public, anon;
revoke execute on function accepter_echange(bigint) from public, anon;
revoke execute on function annuler_echange(bigint) from public, anon;
