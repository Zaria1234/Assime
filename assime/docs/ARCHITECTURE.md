# Architecture — Assimé

Ce document explique comment l'app fonctionne à l'intérieur. À lire avant de modifier le code.

---

## Vue d'ensemble

```
          ┌──────────────────────────────────────────────┐
          │  main.jsx — routes (React Router)            │
          └──────────────┬───────────────────────────────┘
                         │
          ┌──────────────▼───────────────┐
          │  store.jsx — AppProvider      │  ← état global + sauvegarde localStorage
          │  useApp() partout             │  ← GPS (watchPosition), trajet, votes…
          └──────┬───────────────┬───────┘
                 │               │
     ┌───────────▼───┐   ┌───────▼──────────────────────────┐
     │ pages/*.jsx   │   │ lib/  geo · ia · voix · carte ·   │
     │ (écrans)      │──▶│       image  (logique pure)       │
     └───────┬───────┘   └──────────────────────────────────┘
             │
     ┌───────▼────────────────────────────┐
     │ components/  MapView · ui · art     │
     └────────────────────────────────────┘
```

- **Un seul point serveur** pour l'instant : `api/ia.js` (Gemini). Le reste de l'état vit dans `store.jsx` et il est sauvegardé dans le `localStorage` du téléphone.
- Les **données de démonstration** viennent de `src/data/demo.js`.
- La logique sans affichage (calculs, IA, voix) est dans `src/lib/`. Elle est facile à tester et à remplacer.

## Routes

| Route | Composant | Fichier |
| --- | --- | --- |
| `/` | Page de bienvenue, ou directement `/carte` (acheteur) ou `/vendeur` (vendeur) si déjà connecté | `main.jsx` |
| `/bienvenue` `/inscription` `/connexion` `/code` `/role` | Parcours de compte | `pages/Entree.jsx` |
| `/carte` `/trajet` `/retour` | Carte, enregistrement, retour à la moto | `pages/Navigation.jsx` |
| `/recherche` `/boutique/:id` `/guidage/:id` | Recherche, fiche, guidage (`:id` = boutique, repère ou `ext`) | `pages/Navigation.jsx` |
| `/ia` | IA en direct | `pages/IA.jsx` |
| `/explorer` `/liste` `/assistant` `/missions` `/profil` | Exploration, listes, gamification, profil | `pages/Autres.jsx` |
| `/vendeur` `/vendeur/boutique` `/vendeur/articles` | Espace vendeur | `pages/Vendeur.jsx` |

`/guidage/ext?lat=…&lng=…&nom=…&note=…` guide vers un lieu trouvé sur OpenStreetMap.

## L'état global (`store.jsx`)

Tout passe par `const { … } = useApp()`. Chaque valeur persistée a une clé `assime_<nom>` dans le `localStorage`.

| Donnée | Clé | Rôle |
| --- | --- | --- |
| `user` | `user` | `{ prenom, tel, role: 'acheteur' \| 'vendeur', verifie }` |
| `langue`, `voix` | `langue`, `voix` | Langue de guidage, son activé ou non |
| `boutiques` | `boutiques_v2` | Liste des boutiques (articles, photos, position…) |
| `maBoutiqueId` | `ma_boutique` | Boutique du vendeur connecté |
| `coeurs`, `mesVotes` | `coeurs`, `mes_votes` | Coups de cœur reçus et vote de l'utilisateur |
| `interets` | `interets` | Catégories cherchées ou regardées (sert à « Pour toi ») |
| `listes`, `listeId` | `listes`, `liste_active` | Listes de courses avec budget |
| `trajet`, `moto`, `arrets` | `trajet`, `moto`, `arrets` | Trajet en cours, point de départ, arrêts |
| `historique`, `favoris`, `missions`, `raccourcis` | idem | Profil et préférences |

> Si la forme d'une donnée change, **changer sa clé** (ex. `boutiques_v2` → `boutiques_v3`) pour éviter de relire d'anciennes données incompatibles.

## Règles métier importantes

### Enregistrement du trajet (`lib/geo.js` + `store.jsx`)

- Le GPS est suivi en continu (`navigator.geolocation.watchPosition`).
- Un point n'est gardé que si la précision est **≤ 25 m** et qu'il est à **≥ 3 m** du précédent (`keepPoint`).
- Le **premier point** gardé devient **la moto**.
- **Marquer un arrêt** pose un repère numéroté et **met en pause** le tracé. Plus aucun point n'est ajouté jusqu'à « Poursuivre ».
- Sans GPS après 6 s, l'app passe sur une **position simulée** (chip « Position simulée »).

### Retour à la moto

- Le trajet est inversé, puis `cutLoops(points, 8)` **supprime les boucles**. Si l'on repasse à moins de 8 m d'un point déjà vu, tout le détour est retiré.
- Le gain (« −xx m ») s'affiche quand il dépasse 15 m.

### Coups de cœur (`coeursDe`, `voter`)

```
affichés = max(0, pouces levés − pouces baissés)
```

- Un 👎 n'est **jamais affiché** aux visiteurs : il **retire un 👍**.
- S'il ne reste aucun 👍 : « Pas encore de coup de cœur ».
- Le vendeur voit le **nombre de 👎** dans son espace, et il est le seul à le voir.
- Un utilisateur a **un seul vote par boutique**. Il peut le changer ou l'annuler en touchant à nouveau.

### IA locale (`lib/ia.js`)

| Fonction | Rôle |
| --- | --- |
| `rechercher(texte, boutiques, position)` | Comprend les catégories (synonymes), « pas cher », trie par distance ou prix |
| `assistantListe(texte, liste, budget)` | « ajoute… », « j'ai trouvé… à… », « combien il me reste ? », « si je prends… » |
| `lireMontant(texte)` | Lit « 8 000 », « 8 mille », « 12k » |
| `sectionsIA({ sections, interets, … })` | Choisit les boutiques du filtre **Pour toi** |

Ces fonctions servent de **secours**. La vraie IA est **Gemini** : `demanderIA()` appelle `/api/ia`, puis `appliquerOperations()` met à jour la liste et `phraseBudget()` annonce le reste. Si Gemini ne répond pas, l'app utilise les fonctions ci-dessus. Voir [`IA.md`](IA.md).

### Voix (`lib/voix.js`)

- `ecouter()` : reconnaissance vocale du navigateur, en **français**.
- `parler()` : synthèse vocale en français. Pour l'éwé et le mina, prévoir des fichiers audio dans `public/audio/ewe/` et `public/audio/mina/`.
- `dire()` (dans le store) ne parle que si le son est activé. Couper le son arrête immédiatement la voix.

### Photos (`lib/image.js`)

Les photos sont réduites à **720 px** en JPEG avant d'être enregistrées, pour ne pas saturer le téléphone. Avec le back-end, elles iront dans Supabase Storage.

## Qui touche à quoi

Répartition proposée pour une équipe de quatre (à adapter).

| Rôle | Fichiers principaux | Prochaines tâches |
| --- | --- | --- |
| **Front-end / design** | `pages/`, `components/`, `index.css` | Finitions, animations, accessibilité, nouvelles langues de l'interface |
| **Carte et terrain** | `lib/geo.js`, `components/MapView.jsx`, `data/demo.js` | Relevé GPS des allées et des stands, plan GeoJSON, vrai itinéraire |
| **Back-end** | `store.jsx` → Supabase | Comptes, OTP, boutiques, photos, votes, règles de sécurité |
| **IA et voix** | `api/ia.js`, `lib/ia.js`, `lib/voix.js`, `pages/IA.jsx` | Améliorer les consignes Gemini, enregistrements éwé et mina |

## Conventions

- Composants en **PascalCase**, fonctions et variables en **français** (`chercherSurCarte`, `marquerArret`).
- Styles avec **Tailwind** directement dans le JSX. Les classes partagées (`.btn`, `.card`, `.tile`, `.field`) sont dans `index.css`.
- Textes de l'interface en **français simple**, tutoiement, écriture inclusive avec le point médian (« guidé·e »).
- `npm run lint` et `npm run build` doivent passer avant chaque fusion.
