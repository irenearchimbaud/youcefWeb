-- Schéma de la base Supabase du site.
-- À exécuter une seule fois : Supabase → SQL Editor → New query → coller ce fichier → Run.
-- Voir supabase/LISEZMOI.md pour la mise en place complète.

-- ---------------------------------------------------------------------------
-- Profils : un par compte (Youcef = role 'pro', ses clients = role 'client').
-- Les mots de passe ne sont PAS ici : ils sont gérés (hachés) par Supabase Auth.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  email text not null,
  role text not null check (role in ('client', 'pro')),
  solde integer not null default 0 check (solde >= 0),
  -- vrai tant que le client n'a pas remplacé son code de première connexion
  doit_changer_mdp boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  titre text not null,
  fichier text not null,
  type text not null,
  taille integer not null,
  chemin text not null,
  created_at timestamptz not null default now()
);
create index if not exists documents_client_idx on public.documents (client_id);

-- Séances déjà décomptées du solde (évite de décompter deux fois la même réservation Calendly).
create table if not exists public.seances_comptees (
  event_id text primary key,
  client_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sécurité (RLS) : chacun ne voit que ce qui le concerne.
-- ---------------------------------------------------------------------------
create or replace function public.est_pro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'pro');
$$;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.seances_comptees enable row level security;

drop policy if exists profiles_lecture on public.profiles;
create policy profiles_lecture on public.profiles for select
  using (id = auth.uid() or public.est_pro());

-- Seul Youcef peut modifier un profil (nombre de séances). Un client ne peut rien modifier lui-même.
drop policy if exists profiles_modification on public.profiles;
create policy profiles_modification on public.profiles for update
  using (public.est_pro()) with check (public.est_pro());

drop policy if exists documents_lecture on public.documents;
create policy documents_lecture on public.documents for select
  using (client_id = auth.uid() or public.est_pro());

drop policy if exists documents_ajout on public.documents;
create policy documents_ajout on public.documents for insert
  with check (public.est_pro());

drop policy if exists documents_suppression on public.documents;
create policy documents_suppression on public.documents for delete
  using (public.est_pro());

-- seances_comptees : aucune policy = inaccessible depuis le navigateur (le serveur utilise la clé de service).

-- Le client appelle cette fonction après avoir choisi son mot de passe.
create or replace function public.mot_de_passe_change() returns void
language sql security definer set search_path = public as $$
  update public.profiles set doit_changer_mdp = false where id = auth.uid();
$$;
revoke all on function public.mot_de_passe_change() from public, anon;
grant execute on function public.mot_de_passe_change() to authenticated;

-- ---------------------------------------------------------------------------
-- Stockage des documents : bucket privé, 10 Mo max, formats limités.
-- Les fichiers sont rangés dans <id du client>/<fichier>.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documents_fichiers_lecture on storage.objects;
create policy documents_fichiers_lecture on storage.objects for select
  using (bucket_id = 'documents' and (public.est_pro() or (storage.foldername(name))[1] = auth.uid()::text));

drop policy if exists documents_fichiers_ajout on storage.objects;
create policy documents_fichiers_ajout on storage.objects for insert
  with check (bucket_id = 'documents' and public.est_pro());

drop policy if exists documents_fichiers_suppression on storage.objects;
create policy documents_fichiers_suppression on storage.objects for delete
  using (bucket_id = 'documents' and public.est_pro());
