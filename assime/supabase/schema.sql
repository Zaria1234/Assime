-- =====================================================================
-- Assimé — base de données Supabase
-- À coller dans Supabase → SQL Editor → New query → Run (une seule fois).
-- Puis lancer supabase/seed.sql pour les boutiques de démonstration.
-- =====================================================================

-- ---------- Profils (un par téléphone / compte) ----------
create table if not exists public.profils (
  id uuid primary key references auth.users on delete cascade default auth.uid(),
  prenom text not null default '',
  telephone text default '',
  role text not null default 'acheteur' check (role in ('acheteur', 'vendeur')),
  langue text not null default 'ewe',
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);

-- ---------- Boutiques (articles et photos inclus) ----------
create table if not exists public.boutiques (
  id text primary key default gen_random_uuid()::text,
  proprietaire uuid references auth.users on delete set null default auth.uid(),
  nom text not null check (char_length(nom) between 1 and 120),
  categorie text not null check (char_length(categorie) between 1 and 60),
  gros boolean not null default false,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  zone text default '',
  repere text default '',
  horaires text default '',
  telephone text default '',
  whatsapp text default '',
  couverture text,            -- URL de la photo (Supabase Storage)
  photo text,                 -- URL du logo
  articles jsonb not null default '[]'::jsonb,  -- [{id, nom, prix, stock, image}]
  verifiee boolean not null default false,
  coeurs_depart integer not null default 0,     -- coups de cœur de démonstration (réglés par l'admin)
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);
create index if not exists boutiques_categorie on public.boutiques (categorie);

-- ---------- Coups de cœur : un vote par personne et par boutique ----------
create table if not exists public.coups_de_coeur (
  boutique_id text not null references public.boutiques on delete cascade,
  auteur uuid not null references auth.users on delete cascade default auth.uid(),
  sens text not null check (sens in ('plus', 'moins')),
  cree_le timestamptz not null default now(),
  primary key (boutique_id, auteur)
);

-- ---------- Relevés terrain (cartographie des allées) ----------
create table if not exists public.releves (
  id uuid primary key default gen_random_uuid(),
  auteur uuid not null references auth.users on delete cascade default auth.uid(),
  points jsonb not null,               -- [[lat, lng], …]
  marques jsonb not null default '[]', -- [{type: 'carrefour'|'stand'|'entree', pos: [lat, lng], nom}]
  longueur_m real,
  cree_le timestamptz not null default now()
);

-- ---------- Mise à jour automatique de maj_le ----------
create or replace function public.toucher_maj() returns trigger language plpgsql as $$
begin new.maj_le = now(); return new; end $$;
drop trigger if exists boutiques_maj on public.boutiques;
create trigger boutiques_maj before update on public.boutiques for each row execute function public.toucher_maj();
drop trigger if exists profils_maj on public.profils;
create trigger profils_maj before update on public.profils for each row execute function public.toucher_maj();

-- ---------- Un vendeur ne peut pas se « vérifier » lui-même ni changer de propriétaire ----------
create or replace function public.proteger_boutique() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.verifiee := false;
    new.proprietaire := auth.uid();
    new.coeurs_depart := 0;
  else
    new.verifiee := old.verifiee;
    new.proprietaire := old.proprietaire;
    new.coeurs_depart := old.coeurs_depart;
  end if;
  return new;
end $$;
drop trigger if exists boutiques_protection on public.boutiques;
create trigger boutiques_protection before insert or update on public.boutiques
  for each row when (current_user in ('anon', 'authenticated')) execute function public.proteger_boutique();

-- =====================================================================
-- Sécurité (Row Level Security)
-- =====================================================================
alter table public.profils enable row level security;
alter table public.boutiques enable row level security;
alter table public.coups_de_coeur enable row level security;
alter table public.releves enable row level security;

-- Profils : chacun le sien
drop policy if exists "profil lu par soi" on public.profils;
create policy "profil lu par soi" on public.profils for select to authenticated using (id = auth.uid());
drop policy if exists "profil cree par soi" on public.profils;
create policy "profil cree par soi" on public.profils for insert to authenticated with check (id = auth.uid());
drop policy if exists "profil modifie par soi" on public.profils;
create policy "profil modifie par soi" on public.profils for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Boutiques : tout le monde lit, seul le propriétaire modifie
drop policy if exists "boutiques lues par tous" on public.boutiques;
create policy "boutiques lues par tous" on public.boutiques for select to anon, authenticated using (true);
drop policy if exists "boutique creee par un compte" on public.boutiques;
create policy "boutique creee par un compte" on public.boutiques for insert to authenticated with check (true);
drop policy if exists "boutique modifiee par son proprietaire" on public.boutiques;
create policy "boutique modifiee par son proprietaire" on public.boutiques for update to authenticated using (proprietaire = auth.uid());
drop policy if exists "boutique supprimee par son proprietaire" on public.boutiques;
create policy "boutique supprimee par son proprietaire" on public.boutiques for delete to authenticated using (proprietaire = auth.uid());

-- Coups de cœur : chacun voit et gère SON vote (les totaux passent par les fonctions ci-dessous)
drop policy if exists "vote lu par son auteur" on public.coups_de_coeur;
create policy "vote lu par son auteur" on public.coups_de_coeur for select to authenticated using (auteur = auth.uid());
drop policy if exists "vote cree par son auteur" on public.coups_de_coeur;
create policy "vote cree par son auteur" on public.coups_de_coeur for insert to authenticated with check (auteur = auth.uid());
drop policy if exists "vote modifie par son auteur" on public.coups_de_coeur;
create policy "vote modifie par son auteur" on public.coups_de_coeur for update to authenticated using (auteur = auth.uid()) with check (auteur = auth.uid());
drop policy if exists "vote supprime par son auteur" on public.coups_de_coeur;
create policy "vote supprime par son auteur" on public.coups_de_coeur for delete to authenticated using (auteur = auth.uid());

-- Relevés : chacun envoie et voit les siens
drop policy if exists "releve cree par son auteur" on public.releves;
create policy "releve cree par son auteur" on public.releves for insert to authenticated with check (auteur = auth.uid());
drop policy if exists "releve lu par son auteur" on public.releves;
create policy "releve lu par son auteur" on public.releves for select to authenticated using (auteur = auth.uid());

-- =====================================================================
-- Coups de cœur : ce qui est visible
-- =====================================================================
-- Public : seulement le total affiché = max(0, pouces levés − pouces baissés). Jamais le détail.
create or replace function public.coeurs_publics()
returns table (boutique_id text, affiches integer)
language sql stable security definer set search_path = public as $$
  select b.id,
         greatest(0, b.coeurs_depart + count(c.*) filter (where c.sens = 'plus') - count(c.*) filter (where c.sens = 'moins'))::int
  from public.boutiques b left join public.coups_de_coeur c on c.boutique_id = b.id
  group by b.id, b.coeurs_depart
$$;

-- Vendeur : le détail (dont les pouces baissés), uniquement pour SES boutiques
create or replace function public.mes_coeurs()
returns table (boutique_id text, plus integer, moins integer)
language sql stable security definer set search_path = public as $$
  select b.id,
         (b.coeurs_depart + count(c.*) filter (where c.sens = 'plus'))::int,
         (count(c.*) filter (where c.sens = 'moins'))::int
  from public.boutiques b left join public.coups_de_coeur c on c.boutique_id = b.id
  where b.proprietaire = auth.uid()
  group by b.id, b.coeurs_depart
$$;

revoke all on function public.coeurs_publics() from public;
revoke all on function public.mes_coeurs() from public;
revoke execute on function public.mes_coeurs() from anon;
grant execute on function public.coeurs_publics() to anon, authenticated;
grant execute on function public.mes_coeurs() to authenticated;

-- =====================================================================
-- Photos : bucket public « photos », chacun écrit dans son dossier <uid>/
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos lues par tous" on storage.objects;
create policy "photos lues par tous" on storage.objects for select to anon, authenticated using (bucket_id = 'photos');
drop policy if exists "photos envoyees dans son dossier" on storage.objects;
create policy "photos envoyees dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos remplacees dans son dossier" on storage.objects;
create policy "photos remplacees dans son dossier" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos supprimees dans son dossier" on storage.objects;
create policy "photos supprimees dans son dossier" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
-- Temps réel : les changements de boutiques et de votes arrivent sur les autres téléphones
-- =====================================================================
do $$ begin
  begin alter publication supabase_realtime add table public.boutiques; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.coups_de_coeur; exception when duplicate_object then null; end;
end $$;
