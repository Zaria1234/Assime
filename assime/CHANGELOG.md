# Journal des versions

## 1.9.1 — 17 novembre 2026

- **Éwé partout** : toutes les phrases de l'app (écrans, catégories, repères, missions, réponses de l'IA hors ligne, messages d'erreur) sont traduites dans `src/i18n-ewe.js`. Traduction proposée, **à faire vérifier** (`docs/TRADUCTIONS.md`, cases à cocher).
- **IA en éwé** : Gemini répond toujours en éwé quand l'éwé est choisi (avant : en français s'il n'était pas sûr). L'IA de secours (sans internet) comprend aussi les phrases éwé simples (lettres ɔ, ɛ, ƒ, ɖ, ŋ reconnues, mots comme atikedzraƒe, mɔli, ɖa, agbɔsɔsɔ, susɔ, gɔmedzeƒe).
- Page d'accueil : ordre des mots éwé respecté (« Mèga bu le Asigamé o. »).

## 1.9.0 — 17 novembre 2026

### Langues : Éwé · Français · English
- **Mina retiré**, **anglais ajouté**. Tous les textes de l'app passent par `t('cle')` (`src/i18n.js`) : slides, accueil, connexion, carte, explorer, boutique, guidage, liste, IA, missions, profil, espace vendeur, messages et erreurs.
- Toucher une langue change **tout l'écran tout de suite** ; le bouton choisi est en surbrillance. Choix en haut des slides, sur la page d'accueil, sur la carte et dans **Profil → Réglages**. La langue est gardée sur le téléphone (`assime_langue_v2`, français par défaut).
- **L'IA répond dans la langue choisie** (`langue` envoyée à `/api/ia` et ajoutée aux consignes ; l'IA locale répond aussi en anglais et comprend des phrases simples en anglais).
- **Voix** : fr-FR (français et éwé) ou en-US (anglais), pour la lecture et le micro.
- **Éwé** : toute l'app est traduite (`src/i18n-ewe.js`, 521 phrases), **à faire vérifier** par une personne qui parle éwé ; une phrase retirée s'affiche en français. Liste complète dans `docs/TRADUCTIONS.md` (générée depuis le dictionnaire).

### Carte
- **La carte ne se recadre plus toute seule** : elle se centre une seule fois à l'ouverture (ou au démarrage d'un guidage). Le GPS ne touche plus jamais au zoom ni à la position.
- **Bouton « Recentrer »** (rond blanc, cible) en bas à droite : carte, trajet, retour, guidage.
- Les marqueurs et le plan ne changent pas.

### Vendre demande un compte
- Sans compte, « Tu vends au marché ? », l'espace vendeur et « Créer ma boutique » affichent **« Pour vendre, crée d'abord ton compte »**. « Créer mon compte » ouvre l'inscription avec **Vendeur présélectionné** ; après l'inscription, on arrive directement sur **« Créer ma boutique »**. Les acheteurs sans compte gardent tout le reste.

### Trajet
- **« Arrêter »** met en pause et reste sur l'écran ; il devient **« Continuer »** (vert) pour reprendre.
- **« Retourner à mon point de départ »** remplace « Retourner à ma moto ». Petit lien **« Terminer le trajet »** pour arrêter pour de bon.
- Partout, le retour parle de **« mon point de départ »** (« Ma moto » reste seulement dans le dessin de présentation).

### Formulaire « Créer ma boutique »
- Champs obligatoires avec **astérisque rouge** : nom, ce que je vends, position, au moins un contact (téléphone ou WhatsApp).
- Envoi incomplet : **bordure rouge + message rouge** sous chaque champ (« Indique le nom de ta boutique »…), la page va sur la première erreur ; le rouge disparaît dès que le champ est rempli.

### IA
- Phrase rapide touchée : **verte avec un petit chargement** ; toutes les phrases, « Envoyer » et le micro sont bloqués jusqu'à la réponse. Le message apparaît tout de suite avec **« L'IA réfléchit… »** en dessous (IA en direct et assistant de la liste).

### Slides
- « Va où tu veux » : dessin seul (chemin vert, départ et arrivée), sans icône. Les autres slides gardent leurs icônes.

## 1.8.0 — 17 novembre 2026

### Accueil, slides et carte
- **Page d'accueil « Ne te perds plus à Asigamé. »** : retour au design d'origine, à l'identique (halos vert et orangé, carte illustrée, « Ma moto », « Boutique de pagnes · 2 min », bouton orange « Créer mon compte », « J'ai déjà un compte », « Continuer sans compte »). C'est la dernière étape après les 6 slides, qui gardent leur design sobre.
- **Slides** : les icônes reviennent, dans des tuiles blanches `GlassIcon` aux couleurs des catégories (une à trois par slide).
- **Carte en mode Plan par défaut** partout ; le bouton Satellite / Plan démarre sur « Plan ».
- **Plus de noms visibles sur la carte** : un nom qui gêne essaie de se placer à droite, à gauche ou au-dessus de son rond avant d'être masqué.

## 1.7.1 — 17 novembre 2026

### Carte plus lisible
- Les noms qui se chevauchent sont masqués : on garde celui de la boutique qui a le plus de coups de cœur, et un nom ne recouvre plus jamais un autre rond. Le lieu sélectionné et « Ma moto » restent toujours nommés. Le tri est refait à chaque zoom.

## 1.7.0 — 17 novembre 2026

### Écran de découverte refait
- Les slides s'affichent **à chaque arrivée sans être connecté** (premier passage ou après déconnexion). Connecté, on arrive directement sur la carte.
- **« Créer un compte »** (orange) et **« J'ai déjà un compte »** restent en bas de toutes les slides. Plus de bouton « Suivant » : on défile au doigt, avec les points de progression. « Passer » va à la dernière slide.
- La **dernière slide reprend l'ancien écran Bienvenue** : « Ne te perds plus à Asigamé », choix de la langue, « Continuer sans compte ». L'adresse `/bienvenue` y renvoie.
- **Design sobre** : fond blanc uni, dessins SVG gris très clair à traits fins, un seul accent vert. L'orange ne sert qu'au bouton « Créer un compte ».
- Nouveaux textes des 6 slides.
- Profil → « Découvrir Assimé » : pour un compte connecté, les 6 slides avec un bouton « Fermer ».

### Marqueurs de carte façon Google Maps
- Chaque boutique et chaque repère : **rond blanc de 32 px** avec l'icône colorée de sa catégorie (les mêmes que dans le reste de l'app).
- **Badge des coups de cœur** en haut à droite du rond, s'il y en a.
- **Nom sous le rond** à partir du zoom 18 (texte sombre, contour blanc).
- Lieu sélectionné ou destination du guidage : rond de 44 px, bordure verte, nom toujours visible.
- « Toi » : point bleu-vert avec halo ; « Ma moto » : rond blanc avec l'icône moto.
- Les noms saisis par les vendeurs sont échappés avant d'être affichés sur la carte.

### Correction
- Sans compte, l'app ne demande plus `mes_coeurs` ni les votes personnels : plus d'erreur 401 dans la console.

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
