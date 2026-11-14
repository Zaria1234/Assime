-- Tests de sécurité : à lancer avec psql après stubs.sql, schema.sql et seed.sql.
-- Chaque ligne affiche OK ou REFUSÉ : comparer avec le tableau de docs/BACKEND.md.
\set QUIET on
\pset tuples_only on
\set A '11111111-1111-1111-1111-111111111111'
\set B '22222222-2222-2222-2222-222222222222'
\set C '33333333-3333-3333-3333-333333333333'
create or replace function pg_temp.essai(sql text) returns text language plpgsql as $$
declare n int; begin execute sql; get diagnostics n = row_count; return 'OK (' || n || ' ligne)'; exception when others then return 'REFUSÉ : ' || left(sqlerrm, 70); end $$;

\echo '--- Vendeur A crée sa boutique (tente de se mettre vérifié + 999 coeurs)'
set role authenticated; select set_config('request.jwt.claim.sub', :'A', false);
select pg_temp.essai($$insert into boutiques (id, nom, categorie, lat, lng, verifiee, coeurs_depart) values ('ba', 'Chez A', 'Mèches', 6.12, 1.22, true, 999)$$);
select 'proprietaire = A ? ' || (proprietaire = auth.uid()) || ' | verifiee = ' || verifiee || ' | coeurs_depart = ' || coeurs_depart from boutiques where id = 'ba';
select 'A modifie sa boutique : ' || pg_temp.essai($$update boutiques set nom = 'Chez A Mèches' where id = 'ba'$$);
select 'A modifie la boutique démo b1 : ' || pg_temp.essai($$update boutiques set nom = 'Piratée' where id = 'b1'$$);
select 'A supprime b2 : ' || pg_temp.essai($$delete from boutiques where id = 'b2'$$);

\echo '--- Acheteur B'
select set_config('request.jwt.claim.sub', :'B', false);
select 'B lit les boutiques : ' || count(*) from boutiques;
select 'B modifie la boutique de A : ' || pg_temp.essai($$update boutiques set nom = 'Volée' where id = 'ba'$$);
select 'B se donne la boutique de A : ' || pg_temp.essai($$update boutiques set proprietaire = auth.uid() where id = 'ba'$$);
select 'B vote plus pour ba : ' || pg_temp.essai($$insert into coups_de_coeur (boutique_id, sens) values ('ba', 'plus')$$);
select 'B revote pour ba (doublon) : ' || pg_temp.essai($$insert into coups_de_coeur (boutique_id, sens) values ('ba', 'plus')$$);
select 'B vote au nom de C : ' || pg_temp.essai($$insert into coups_de_coeur (boutique_id, auteur, sens) values ('ba', '33333333-3333-3333-3333-333333333333', 'plus')$$);

\echo '--- Acheteur C vote moins pour ba et plus pour b3'
select set_config('request.jwt.claim.sub', :'C', false);
select pg_temp.essai($$insert into coups_de_coeur (boutique_id, sens) values ('ba', 'moins'), ('b3', 'plus')$$);
select 'C voit les votes des autres ? lignes visibles = ' || count(*) from coups_de_coeur;
select 'Public ba : ' || affiches from coeurs_publics() where boutique_id = 'ba';
select 'Public b3 (38 + 1) : ' || affiches from coeurs_publics() where boutique_id = 'b3';
select 'C appelle mes_coeurs (pas vendeur) : ' || count(*) from mes_coeurs();

\echo '--- Vendeur A voit ses pouces baissés'
select set_config('request.jwt.claim.sub', :'A', false);
select 'mes_coeurs A : ' || boutique_id || ' plus=' || plus || ' moins=' || moins from mes_coeurs();

\echo '--- Visiteur anonyme (sans compte)'
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select 'anon lit boutiques : ' || count(*) from boutiques;
select 'anon lit coeurs publics : ' || count(*) from coeurs_publics();
select 'anon crée une boutique : ' || pg_temp.essai($$insert into boutiques (nom, categorie, lat, lng) values ('x', 'y', 6, 1)$$);
select 'anon vote : ' || pg_temp.essai($$insert into coups_de_coeur (boutique_id, sens) values ('b1', 'plus')$$);
select 'anon mes_coeurs : ' || pg_temp.essai($$select * from mes_coeurs()$$);

\echo '--- Photos et relevés'
reset role; set role authenticated; select set_config('request.jwt.claim.sub', :'A', false);
select 'A envoie photo dans son dossier : ' || pg_temp.essai(format($$insert into storage.objects (bucket_id, name) values ('photos', '%s/couverture.jpg')$$, :'A'));
select 'A envoie photo dans le dossier de B : ' || pg_temp.essai(format($$insert into storage.objects (bucket_id, name) values ('photos', '%s/x.jpg')$$, :'B'));
select 'A envoie un relevé : ' || pg_temp.essai($$insert into releves (points) values ('[[6.12,1.22],[6.121,1.221]]')$$);
select set_config('request.jwt.claim.sub', :'B', false);
select 'B voit le relevé de A ? ' || count(*) from releves;
select 'B crée son profil : ' || pg_temp.essai($$insert into profils (prenom, role) values ('Afi', 'acheteur')$$);
select 'B voit les profils : ' || count(*) from profils;
select set_config('request.jwt.claim.sub', :'A', false);
select 'A voit le profil de B ? ' || count(*) from profils;
