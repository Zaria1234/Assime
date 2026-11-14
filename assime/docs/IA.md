# IA — Gemini dans Assimé

L'IA d'Assimé utilise **Google Gemini**. Elle répond dans **« Parler à l'IA »** (IA en direct) et dans **l'assistant de Ma liste**.

---

## Comment ça marche : un agent avec des outils

Gemini ne reçoit pas une réponse toute faite : il **décide lui-même quels outils appeler**, lit leurs résultats, en appelle d'autres si besoin (jusqu'à 6 étapes), puis termine avec l'outil `repondre`.

```
« Où je trouve du riz en gros pas cher, et c'est loin ? »
   │
   ▼  Gemini réfléchit
   ├─▶ chercher_boutiques(riz, en gros, tri prix)  → Grossiste Akpénè, riz 50 kg 27 000 F, 76 m
   ├─▶ calculer_trajet(b8)                          → 76 m, 1 min, vers le nord-est
   └─▶ repondre(« Va chez Grossiste Akpénè… », boutiques: [b8])
   │
   ▼  L'app affiche la boutique avec « Y aller » et lit la réponse
```

| Outil | Ce qu'il fait | Calcul fait par |
| --- | --- | --- |
| `chercher_boutiques` | Par article, catégorie, nom, en gros, prix max ; tri distance / prix / coups de cœur | le serveur (code) |
| `comparer_prix` | Un article dans toutes les boutiques, du moins cher au plus cher | le serveur |
| `details_boutique` | Articles, stock, horaires, repère, contact | le serveur |
| `chercher_reperes` | Pharmacie, banque, cathédrale, toilettes, parking, mobile money… | le serveur |
| `chercher_sur_carte_lome` | Lieux hors du marché (Ramco, hôtels, rues) via OpenStreetMap | OpenStreetMap |
| `calculer_trajet` | Distance, minutes à pied, direction | le serveur |
| `etat_liste` | Budget, dépensé, reste (exact) | le serveur |
| `recherche_web` | Information récente sur internet (Google Search intégré à Gemini), avec sources | Gemini + Google |
| `repondre` | Réponse finale, boutiques / lieux à afficher, changements de liste | — |

**Règle d'or : Gemini comprend et choisit, le code calcule.** Les distances, prix et montants viennent toujours des outils, jamais de l'imagination du modèle.

Garde-fous :
- **La clé ne quitte jamais le serveur.**
- **Rien d'inventé** : le serveur retire toute boutique, tout repère ou tout lieu de Lomé qui ne vient pas des outils.
- **Mémoire** : les 6 derniers échanges sont envoyés, on peut dire « et la deuxième, elle ferme à quelle heure ? ».
- **Repli** : sans réseau, sans clé, si Gemini ne conclut pas ou met plus de 25 s, l'app répond avec l'**IA locale**. La démo ne casse jamais.
- Sous chaque réponse : l'étiquette **✦ Gemini** et les **outils utilisés** (Boutiques, Trajet, Carte de Lomé…).

## Ce que Gemini comprend

| On dit | Ce qui se passe |
| --- | --- |
| « Je cherche du riz en gros pas cher » | Jusqu'à 3 boutiques proposées, avec « Y aller » |
| « Où acheter des mèches près d'ici ? » | Tri par distance et par coups de cœur |
| « Où est la pharmacie ? » | Le repère du marché, avec « Y aller » |
| « Tu connais Ramco ? » | Pas dans le marché : recherche sur la carte de Lomé, avec « Y aller » |
| « Où le riz est le moins cher ? » | Comparaison des prix dans toutes les boutiques |
| « Et la deuxième, c'est loin ? » | Se souvient de la conversation, calcule le trajet |
| « J'ai trouvé les chaussures à 8 000 » | Article coché avec son prix, budget annoncé |
| « Ajoute de l'huile et du savon » | Articles ajoutés à la liste |
| « Enlève le lait » | Article retiré |
| « Combien il me reste ? » | Phrase exacte calculée par l'app |
| « Ramène-moi à ma moto » | Bouton « Retour à ma moto » |

## Activer Gemini

### 1. Créer la clé (2 minutes, gratuit)

1. Aller sur **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** avec un compte Google.
2. **Create API key** → copier la clé.

> Sur l'offre gratuite, Google peut utiliser les échanges pour améliorer ses produits. Il ne faut envoyer **aucune donnée personnelle sensible** (l'app n'envoie que la phrase, les boutiques, la liste et le budget).

### 2. En local (sur ton ordinateur)

```bash
cp .env.example .env.local
# ouvrir .env.local et coller la clé :  GEMINI_API_KEY=ta_clé
npm run dev
```

`npm run dev` sert `/api/ia` comme Vercel. Pas besoin d'outil en plus.

### 3. En ligne (Vercel)

Vercel → ton projet → **Settings → Environment Variables** :

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | ta clé |

Puis **Deployments → Redeploy**. Le dossier `api/` est détecté automatiquement.

### Vérifier que ça marche

Le plus simple : **Profil → Tester l'IA (Gemini)** (page `/test-ia`). Elle affiche si la clé marche, l'erreur exacte en français, le temps de réponse et la réponse brute.

Ou en ligne de commande :

```bash
curl -X POST https://<ton-lien>.vercel.app/api/ia \
  -H "Content-Type: application/json" \
  -d '{"message":"je cherche du riz","boutiques":[{"id":"b8","nom":"Grossiste Akpénè","categorie":"Alimentation","gros":true}]}'
```

Réponse attendue : un JSON avec `"reponse"` et `"boutiques": ["b8"]`.

| Réponse | Cause | Solution |
| --- | --- | --- |
| `GEMINI_API_KEY manquante` | Variable absente | L'ajouter, puis redéployer |
| `Gemini a répondu 400` ou `404` | Nom de modèle refusé | Mettre `GEMINI_MODEL` sur un modèle listé dans AI Studio |
| `Gemini a répondu 429` | Quota gratuit dépassé | Attendre une minute. L'app passe sur l'IA locale en attendant |

## Changer de modèle

Par défaut : **`gemini-flash-latest`**, l'alias de Google qui suit automatiquement le dernier modèle Flash.
Pour en fixer un : variable `GEMINI_MODEL` (ex. le nom exact affiché dans AI Studio).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `api/ia.js` | L'agent : consignes, boucle d'outils, vérification de la réponse |
| `api/_outils.js` | Les outils (recherche, prix, trajet, repères, carte de Lomé, internet) |
| `vite.config.js` | Sert `/api/ia` en local avec `npm run dev` |
| `src/lib/ia.js` | `demanderIA()` (appel + repli), `appliquerOperations()`, `phraseBudget()`, IA locale |
| `src/pages/IA.jsx` | IA en direct (voix) |
| `src/pages/Autres.jsx` → `Assistant` | Assistant de la liste |

Pour modifier le comportement de l'IA : le texte `CONSIGNES` dans `api/ia.js`. Pour ajouter un outil : une déclaration dans `DECLARATIONS` et un `case` dans `executer()` (`api/_outils.js`).

> La recherche internet (`recherche_web`) utilise l'outil Google Search de Gemini. Selon l'offre de ta clé, elle peut avoir ses propres limites ou être payante au-delà d'un quota : vérifie dans AI Studio. Si elle échoue, l'agent continue sans.
