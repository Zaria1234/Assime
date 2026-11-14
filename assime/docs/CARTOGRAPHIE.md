# Cartographie — Assimé

## Aujourd'hui : les moyens du bord

Le guidage suit les **vraies rues** grâce aux données **OpenStreetMap** déjà existantes autour du Grand Marché. Aucun relevé terrain n'est nécessaire pour l'instant.

| Situation | Comment l'app guide |
| --- | --- |
| Retour à la moto | Ton **propre chemin enregistré**, inversé, boucles coupées |
| Vers une boutique, un repère, un lieu de Lomé | **Plus court chemin à pied par les rues** (OpenStreetMap) |
| Dernier bout dans une allée non cartographiée | À vol d'oiseau, indiqué à l'écran (« derniers 40 m à vol d'oiseau ») |
| Plan des rues indisponible | Ligne droite, comme avant : rien ne casse |

À l'écran : la distance **réelle à marcher**, une consigne (« Tout droit 120 m, puis à gauche ») et la route orange qui suit les rues.

## D'où viennent les rues

L'app charge le réseau des rues dans cet ordre :

1. **`public/data/reseau-marche.json`**, intégré à l'app. Il marche **hors ligne**, c'est le plus fiable pour la démo.
2. Le **cache du téléphone** (gardé une semaine).
3. **OpenStreetMap en direct** (serveur Overpass), si les deux premiers manquent.

### Créer le fichier intégré (recommandé avant la démo)

Sur un ordinateur connecté à internet, dans le dossier du projet :

```bash
npm run carte
```

Cette commande télécharge les rues dans un rayon d'environ 900 m autour du marché et crée `public/data/reseau-marche.json`. Il faut ensuite l'ajouter à GitHub (`git add public/data && git commit && git push`). Vercel redéploie et le guidage marche même sans réseau.

> Données © contributeurs OpenStreetMap, licence ODbL. La mention est affichée dans l'app (bouton « i » de la carte).

## Comment ça marche (technique)

| Fichier | Rôle |
| --- | --- |
| `src/lib/itineraire.js` | Chargement du réseau, graphe, plus court chemin (A*), consigne de virage |
| `scripts/telecharger-reseau.mjs` | `npm run carte` : télécharge et enregistre le réseau |
| `src/pages/Navigation.jsx` → `Guidage` | Affiche la route, la distance et la consigne |

- Le calcul se fait **dans le téléphone**, en quelques millisecondes (testé : 50 ms sur 10 000 points).
- Point de départ et d'arrivée « accrochés » à la rue la plus proche, à 150 m maximum.
- Si le détour par les rues fait plus de 3 fois la ligne droite, l'app garde la ligne droite.

## Plus tard : le relevé terrain

Pour guider jusqu'au stand dans les petites allées intérieures :

1. **Mode relevé** dans l'app : l'équipe marche dans les allées, le GPS enregistre, on marque carrefours et stands.
2. Les traces des téléphones arrivent dans le **back-end** (Supabase).
3. Le code les nettoie et les **ajoute au même réseau**, au même format que `reseau-marche.json`.

Le guidage n'a rien à changer : il utilisera automatiquement les nouvelles allées.
