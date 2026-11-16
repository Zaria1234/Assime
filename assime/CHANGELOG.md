# Journal des versions

## 1.6.0 — 16 novembre 2026

### Écran de découverte
- **6 slides à la première ouverture**, avant Bienvenue : le marché dans ta langue, retrouver sa moto, trouver la bonne boutique, parler à l'IA, la liste et le budget, l'espace vendeur.
- On défile **au doigt** (swipe gauche/droite), avec « Suivant », le bouton retour, les points de progression ou les **flèches du clavier**. « Passer » en haut à droite ; sur la dernière slide, « Commencer » mène à Bienvenue.
- Vu une fois, c'est mémorisé sur le téléphone (`assime_decouverte_vue`) : les slides ne reviennent plus au rechargement.
- **Profil → « Découvrir Assimé »** pour les revoir à tout moment (on revient ensuite au Profil).
- Illustrations dessinées dans le code (SVG + tuiles `GlassIcon`), sans image externe ; apparition en fondu + glissement, coupée avec `prefers-reduced-motion`.
- Nouvelle route `/decouverte`, nouveau fichier `src/pages/Decouverte.jsx`.

## 1.5.1 — 14 novembre 2026

### Finitions
- Plus aucun message technique à l'écran (JSON, codes d'erreur, « OK ») : « Boutique enregistrée », « Ça n'a pas marché, réessaie ». Les détails vont dans la console.
- Profil : « Discuter avec l'IA » ouvre l'assistant. La page de diagnostic `/test-ia` reste accessible par son adresse seulement.
- Étiquettes « ✦ IA Assimé » et « Mode hors ligne » ; plus d'étiquettes d'outils sous les réponses.
- Une seule fonction `reinitialiserDonneesPerso()` pour un nouveau compte, un autre compte et la déconnexion.
- Au démarrage, la liste, les favoris et les raccourcis d'exemple d'une ancienne version sont retirés (hors Mode démo).

## 1.5.0 — 14 novembre 2026

### Vrais comptes
- **Par téléphone** : nouvelle fonction serveur `api/compte.js` (clé `SUPABASE_SERVICE_ROLE_KEY`, côté serveur uniquement). Elle crée ou retrouve un vrai compte Supabase lié au numéro et ouvre une vraie session. Code SMS de démonstration (n'importe quels 6 chiffres) : un seul endroit à brancher plus tard, `codeSmsValide()`.
- **Par e-mail** : code à 6 chiffres ou lien « Log In » envoyé par Supabase. Choix « Par téléphone » / « Par e-mail » à l'inscription et à la connexion.
- **Connexion = numéro seul** : le prénom et le rôle sont relus sur le serveur, plus jamais redemandés.
- **Se déconnecter** (Profil) : fin de session, données du compte effacées du téléphone, retour à Bienvenue.
- Comptes anonymes seulement pour « Continuer sans compte » (et un vote sans compte).

### Un nouveau compte commence vide
- Une seule liste « Ma liste », sans article, budget à remplir ; historique, favoris, missions, points, raccourcis et intérêts à zéro.
- Les exemples (liste « Marché de samedi », trajet simulé) n'arrivent qu'avec **Mode démo**.
- Les boutiques du marché restent : elles appartiennent au marché, pas au compte.

### Données qui suivent le compte
- Nouvelle table `listes` (RLS : chacun les siennes) et colonne `profils.favoris`.
- Listes et favoris synchronisés ; un vendeur qui se reconnecte retrouve **sa** boutique.

## 1.4.1 — 14 novembre 2026

### IA plus fiable
- Si le modèle Gemini principal est surchargé (503/429), absent (404) ou ne répond pas en 8 s, l'agent bascule tout seul sur `gemini-flash-lite-latest`.
- Chaque appel à Gemini a un délai maximum (Vercel coupe la fonction à 30 s).
- Carte des rues OpenStreetMap générée (`public/data/reseau-marche.json`).

## 1.4.0 — 14 novembre 2026

### Back-end Supabase
- Base partagée : **boutiques (articles, photos), coups de cœur, profils, relevés de trajets**.
- **Comptes anonymes** : une identité par téléphone, sans SMS ; chaque vendeur ne modifie que sa boutique, un vote par personne.
- Sécurité testée sur PostgreSQL 16 + PostgREST (moteur de Supabase) : modification d'une boutique d'autrui, double vote, vote au nom d'un autre, photo dans un autre dossier, auto-vérification… tous refusés.
- Pouces baissés visibles **uniquement par le vendeur** ; le public ne voit que le total.
- Photos envoyées dans Supabase Storage ; **temps réel** entre téléphones.
- Les trajets terminés sont envoyés (sans nom) comme relevés pour la future cartographie.
- **Repli total** : sans clés ou sans réseau, l'app garde tout sur le téléphone.
- Indicateur « Synchronisé en ligne » dans Profil et dans l'espace vendeur.
- `supabase/schema.sql`, `supabase/seed.sql`, `supabase/tests/`, guide pas à pas `docs/BACKEND.md`.

## 1.3.0 — 14 novembre 2026

### Guidage par les vraies rues
- Le guidage suit les rues **OpenStreetMap** autour du marché : plus court chemin à pied (A*), calculé dans le téléphone.
- Distance réelle à marcher, consigne (« Tout droit 120 m, puis à gauche »), route tracée sur la carte.
- Derniers mètres à vol d'oiseau quand l'allée n'est pas cartographiée, indiqué à l'écran.
- `npm run carte` : télécharge le réseau des rues dans l'app pour un guidage hors ligne.
- Repli automatique sur la ligne droite si le plan est indisponible.
- Nouvelle documentation : `docs/CARTOGRAPHIE.md`.

## 1.2.0 — 14 novembre 2026

### Gemini devient un agent avec des outils
- Gemini choisit lui-même ses outils : boutiques, comparaison de prix, fiche boutique, repères, **carte de Lomé**, **trajet**, liste et budget, **recherche internet** (avec sources).
- Jusqu'à 6 étapes de raisonnement, puis réponse finale structurée.
- **Mémoire de la conversation** (6 derniers échanges).
- Les calculs (distances, prix, budget) restent faits par le code, jamais par le modèle.
- Le serveur filtre tout ce qui n'a pas été trouvé par un outil.
- Sous chaque réponse : les outils utilisés et les sources web.
- Délai porté à 25 s ; `vercel.json` autorise 30 s pour la fonction.

## 1.1.0 — 14 novembre 2026

### IA : Google Gemini branché
- Nouvelle fonction serveur `api/ia.js` : la clé reste cachée sur Vercel.
- **IA en direct** et **assistant de Ma liste** répondent avec Gemini : recherche de boutiques, cocher, ajouter ou retirer des articles, retour à la moto.
- Les montants (« il te reste… ») sont calculés par l'app, jamais par le modèle.
- Le serveur retire toute boutique inventée par le modèle.
- Repli automatique sur l'IA locale sans réseau, sans clé ou après 12 s.
- Étiquette **✦ Gemini** / **IA locale (hors ligne)** sur chaque réponse.
- `npm run dev` sert aussi `/api/ia` en local (clé dans `.env.local`).
- Page **Tester l'IA** (`/test-ia`, depuis le Profil) : diagnostic clair de la clé, du modèle et du réseau.
- IA locale corrigée : elle ignore les mots vides (« boutique », « marché », « Togo »…) qui faussaient les réponses.
- L'IA connaît les **repères** (pharmacie, banque, toilettes…) et cherche les lieux hors du marché (ex. Ramco) sur la **carte de Lomé**, avec « Y aller ».
- Nouvelle documentation : `docs/IA.md`.

## 1.0.0 — 14 novembre 2026

Première version complète du front-end, prête pour le Hackathon CREATE WITH AI.

### Navigation
- Enregistrement du trajet GPS avec filtrage des points imprécis.
- **Arrêts** : le trajet se met en pause, puis reprend avec « Poursuivre ».
- Retour à la moto par le plus court, en supprimant les boucles.
- Guidage vers boutiques, repères du marché et lieux de Lomé (OpenStreetMap), arrêts possibles.
- Bouton « Couper le son » bien visible pendant le guidage.
- Mode démo et position simulée quand le GPS ne répond pas.

### IA
- **IA en direct** : conversation vocale continue (écoute → réponse à voix haute → écoute).
- Recherche en langage naturel (« riz en gros pas cher »).
- Assistant de liste vocal (« j'ai trouvé… à… », « combien il me reste ? »).
- Filtre **Pour toi** : boutiques choisies selon les recherches et les visites.

### Boutiques et confiance
- **Coups de cœur** 👍 / 👎 : 👍 visibles sur la carte, 👎 privés pour le vendeur, et chaque 👎 retire un 👍.
- Filtres : Tourisme et souvenirs, Alimentation générale, Grossistes, catégories.
- Nouvelles catégories : Alimentation, Mèches et coiffure, Artisanat. Le vendeur peut aussi créer la sienne.

### Espace vendeur
- Photo de couverture et logo, catégorie libre, position GPS, téléphone, WhatsApp, horaires.
- Articles avec photo, prix et stock, modifiables et supprimables.
- Carte « Mes coups de cœur » avec les pouces baissés visibles par le vendeur seul.

### Design
- Fond clair, couleur placée à des endroits précis, barre de navigation noire.
- Icônes Phosphor colorées sur tuiles blanches.
- Boutiques sans photo : fond vert clair.
- Accueil et connexion en vert avec dégradé crème.
- Carte épurée : points violets plats, sans halo.
- Espacements agrandis, défilement corrigé sur tous les écrans.

### Qualité
- ESLint (`npm run lint`), `.editorconfig`, `.nvmrc`, `.env.example`.
- Documentation complète dans `docs/` et captures d'écran.
