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

## Comptes

| Moyen | Comment ça marche |
| --- | --- |
| **Téléphone** | Inscription : code de démo puis `POST /api/compte` (`inscription`) crée le compte `<numéro>@tel.assime.app` avec son mot de passe. Connexion : `signInWithPassword` avec cet e-mail technique. **Code SMS de démo** : n'importe quels 6 chiffres. Pour un vrai SMS, remplir **uniquement** `codeSmsValide()` dans `api/compte.js` (tous les codes téléphone y passent). |
| **E-mail** | Inscription : `signUp` (e-mail + mot de passe) → Supabase envoie un code à 6 chiffres (`verifyOtp`, type `signup`) ou un lien de confirmation. Connexion : `signInWithPassword`. |
| **Sans compte** | Compte anonyme, seulement avec « Continuer sans compte » (dernière slide, accueil, écran de connexion). Vendre demande un compte. |

**Actions de `api/compte.js`** (toutes vérifient le code, sauf `etat`) :

| Action | Rôle |
| --- | --- |
| `etat` | Le numéro a-t-il un compte, et un mot de passe ? (anciens comptes sans mot de passe → on leur fait créer un mot de passe) |
| `inscription` | Crée le compte téléphone (prénom, rôle, mot de passe ≥ 8 caractères) |
| `motDePasse` | Mot de passe oublié (ou création) pour un compte téléphone |
| `telephone` | Changer de numéro (session obligatoire) : met à jour `profils.telephone` et l'e-mail technique |

- **Mot de passe oublié** : e-mail → `resetPasswordForEmail` (lien vers `/mot-de-passe/nouveau`, ou code) ; téléphone → code de démo + `motDePasse`.
- **Modifier mon profil** : prénom (`profils`), e-mail (`updateUser` → code envoyé au nouvel e-mail, type `email_change`), téléphone (`telephone`), mot de passe (ancien vérifié, puis `updateUser`).
- ⚠️ **Tant que le code téléphone est un code de démo**, n'importe qui connaissant un numéro peut réinitialiser le mot de passe de ce compte. À corriger en branchant un vrai SMS dans `codeSmsValide()` avant un lancement public.
- **Supprimer ma boutique** : `delete` sur `boutiques` (règle « supprimée par son propriétaire ») puis suppression des fichiers `photos/<uid>/` (règle « photos supprimées dans son dossier »). Les votes liés partent avec (`on delete cascade`).

- **Inscription** = prénom + numéro (ou e-mail) + mot de passe + rôle. **Connexion** = numéro (ou e-mail) + mot de passe : prénom et rôle relus dans `profils`.
- **Nouveau compte = tout vide** (liste, favoris, historique, missions, points). Les boutiques du marché restent.
- **Se déconnecter** efface du téléphone les données du compte ; elles reviennent à la reconnexion.
- Variable **serveur** `SUPABASE_SERVICE_ROLE_KEY` (Vercel → Environment Variables, **sans** préfixe `VITE_`). Elle ne doit jamais aller dans `src/` ni dans Git.

### E-mails : à savoir
- Sur l'offre gratuite, Supabase utilise son propre serveur d'envoi : **2 e-mails par heure**, et seulement vers les adresses des membres de l'organisation Supabase.
- Le **modèle d'e-mail ne peut pas être modifié** sans SMTP personnalisé : l'e-mail contient donc seulement un **lien** (qui confirme et connecte). Pour afficher le **code à 6 chiffres** demandé par l'app : brancher un SMTP (Authentication → SMTP Settings, ex. Brevo ou Resend, gratuits), puis ajouter `{{ .Token }}` dans Authentication → Email Templates → **Confirm signup**, **Reset password** et **Change email address**.
- « Secure email change » (Authentication → Providers → Email) demande aussi une confirmation sur l'**ancien** e-mail : l'app l'indique (« confirme aussi avec le message reçu sur ton ancien e-mail »).
- Ajouter `https://assime-xi.vercel.app/mot-de-passe/nouveau` aux URL de retour (lien de réinitialisation).
- URL de retour autorisées : Authentication → URL Configuration (`https://assime-xi.vercel.app/**`).

## Ce qui est partagé

| Donnée | Qui lit | Qui écrit |
| --- | --- | --- |
| Boutiques (articles, photos, horaires, contact) | Tout le monde | Seulement **son propriétaire** |
| Photos (bucket `photos`) | Tout le monde | Chacun dans **son dossier** |
| Coups de cœur | **Total public** = max(0, 👍 − 👎) | Un vote par personne et par boutique |
| Pouces baissés (détail) | **Seulement le vendeur** de la boutique | — |
| Profil (prénom, téléphone, rôle, favoris) | Soi-même | Soi-même |
| Listes de marché (table `listes`) | Soi-même | Soi-même |
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
