# Back-end — Supabase

Le back-end partage les données entre tous les téléphones : **boutiques, photos, coups de cœur, profils et relevés de trajets** (pour la cartographie).

- **Sans configuration**, l'app marche comme avant : tout reste sur le téléphone.
- **Avec les deux clés Supabase**, elle se synchronise toute seule, sans rien changer d'autre.

---

## Mise en place (15 minutes, gratuit)

### 1. Créer le projet
1. Va sur **[supabase.com](https://supabase.com)** → **Start your project** → connecte-toi avec GitHub ou Google.
2. **New project** : nom `assime`, un mot de passe de base de données (garde-le), région **la plus proche** (Europe de l'Ouest par exemple).
3. Attends 1 à 2 minutes que le projet soit prêt.

### 2. Créer les tables
1. Menu de gauche → **SQL Editor** → **New query**.
2. Copie **tout** le fichier `supabase/schema.sql`, colle-le, clique **Run**. Le message attendu est « Success ».
3. Nouvelle requête, avec **tout** `supabase/seed.sql` → **Run**. Ça ajoute les 12 boutiques de démonstration.

Les deux fichiers peuvent être relancés sans risque : ils ne créent pas de doublons.

### 3. Autoriser les comptes anonymes
**Authentication** → **Sign In / Providers** (ou **Providers**) → active **Allow anonymous sign-ins** → **Save**.

> Chaque téléphone reçoit ainsi une identité invisible, **sans SMS**. C'est ce qui permet à un vendeur de modifier **seulement sa** boutique, et à chacun de voter **une seule fois**.

### 4. Récupérer les deux clés
**Project Settings** → **API** (ou **Data API** / **API Keys**) :

| À copier | Nom dans l'app |
| --- | --- |
| Project URL (`https://xxxx.supabase.co`) | `VITE_SUPABASE_URL` |
| Clé **publique** : `anon` ou `publishable` (pas la clé `service_role` / `secret` !) | `VITE_SUPABASE_ANON_KEY` |

La clé publique peut être visible dans le navigateur : la sécurité vient des règles de la base (étape 2).
**Ne mets jamais la clé `service_role` / `secret` dans l'app.**

### 5. Brancher l'app
- **Sur ton ordinateur** : ajoute les deux lignes dans `.env.local`, puis relance `npm run dev`.
  ```
  VITE_SUPABASE_URL=https://xxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...ou sb_publishable_...
  ```
- **En ligne** : Vercel → **Settings → Environment Variables** → ajoute les deux mêmes variables → **Redeploy**.

### 6. Vérifier
Dans l'app : **Profil → Réglages**. Tu dois voir un point vert **« Synchronisé en ligne »**.
Ensuite, crée une boutique dans l'espace vendeur sur un téléphone : elle apparaît sur un autre téléphone.

---

## Ce qui est partagé

| Donnée | Qui lit | Qui écrit |
| --- | --- | --- |
| Boutiques (articles, photos, horaires, contact) | Tout le monde | Seulement **son propriétaire** |
| Photos (bucket `photos`) | Tout le monde | Chacun dans **son dossier** |
| Coups de cœur | **Total public** = max(0, 👍 − 👎) | Un vote par personne et par boutique |
| Pouces baissés (détail) | **Seulement le vendeur** de la boutique | — |
| Profil (prénom, téléphone, rôle) | Soi-même | Soi-même |
| Relevés de trajets (cartographie) | Leur auteur (et l'admin) | Envoyés à la fin d'un trajet, **sans nom** |

Protections supplémentaires :
- Un vendeur **ne peut pas** se marquer « Vérifiée », se donner des coups de cœur ni changer de propriétaire.
- Le **temps réel** est actif : une boutique modifiée apparaît sur les autres téléphones sans recharger.

### Tâches d'admin (dans Supabase → Table Editor)
- **Vérifier une boutique** : table `boutiques` → colonne `verifiee` → `true`.
- **Corriger une position** : colonnes `lat` / `lng`.
- **Voir les relevés** pour la cartographie : table `releves`.

---

## Testé

Le schéma a été testé sur un vrai PostgreSQL 16, avec PostgREST (le moteur de Supabase) et l'app dans deux navigateurs :

| Test | Résultat |
| --- | --- |
| Schéma et données de démo, lancés deux fois | ✅ sans erreur, sans doublon |
| Vendeur A crée sa boutique avec photo | ✅ enregistrée, propriétaire A, « Vérifiée » forcé à non |
| A modifie ou supprime une boutique qui n'est pas à lui | ✅ refusé |
| B modifie la boutique de A ou se l'approprie | ✅ refusé |
| B vote deux fois, ou au nom de quelqu'un d'autre | ✅ refusé |
| Le public voit le détail des votes | ✅ non, seulement le total |
| Le vendeur voit ses pouces baissés | ✅ oui (« 1 client n'a pas aimé ») |
| Photo dans le dossier de quelqu'un d'autre | ✅ refusé |
| Visiteur sans compte : crée, vote | ✅ refusé (lecture seule) |
| L'acheteur B voit la boutique et la photo de A | ✅ |

Les scripts de test sont dans `supabase/tests/`.

---

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `supabase/schema.sql` | Tables, sécurité, fonctions des coups de cœur, bucket photos, temps réel |
| `supabase/seed.sql` | Boutiques de démonstration (régénérer : `node scripts/generer-seed.mjs`) |
| `supabase/tests/` | Tests de sécurité (PostgreSQL local) |
| `src/lib/supabase.js` | Connexion, compte anonyme, lecture et écriture, photos, temps réel |
| `src/store.jsx` | Synchronisation : chargement au démarrage, envoi de « ma boutique », votes, profil, relevés |

## Plus tard
- **Vrai SMS** (connexion par code) : Supabase Auth → Phone, avec un fournisseur SMS (payant). Les comptes anonymes pourront être rattachés au numéro.
- **Anti-abus** : activer le CAPTCHA des comptes anonymes (Authentication → Attack Protection) avant le lancement public.
- **L'IA lit la base directement** : la fonction `api/ia.js` pourra interroger Supabase au lieu de recevoir les boutiques du téléphone.
