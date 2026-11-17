# Design — Assimé

Règles visuelles de l'app. À respecter pour que tous les écrans restent cohérents.

## Principes

1. **Clair et lisible en plein soleil.** Fond clair, texte presque noir, gros boutons.
2. **La couleur à des endroits précis.** Le fond reste neutre ; la couleur sert à guider l'œil, pas à décorer.
3. **Une action principale par écran**, en orange.
4. **Pas d'effets lourds** sur la carte : marqueurs plats, pas de halo, pas de flou.
5. **Textes courts**, tutoiement, français simple.

## Couleurs

| Rôle | Couleur | Utilisation |
| --- | --- | --- |
| Vert Assimé | `#176B52` | Logo, micro, position et trajet, « Continuer », accueil et connexion |
| Vert clair | `#E6F4EC` | Fonds des boutiques sans photo, messages de confirmation |
| Orange | `#F5A623` | **Action principale** uniquement (« Enregistrer mon trajet », « M'y emmener », « Créer mon compte »), ta position |
| Encre | `#16181D` | Textes, barre de navigation, filtres sélectionnés |
| Violet | `#7B61F0` / `#B9A7FF` | Boutiques sur la carte, carte « Zone à découvrir », missions |
| Jaune | `#FFCB5C` | Carte du budget dans « Ma liste » |
| Fond | `#F4F4F7` | Fond des écrans (blanc `#FFFFFF` pour l'accueil et la connexion) |
| Gris texte | `#6E7280` | Textes secondaires |
| Bordure | `#ECECF1` | Contours des cartes et des champs |

Les couleurs sont déclarées une seule fois dans `src/index.css` (`@theme`). Elles s'utilisent en classes Tailwind : `bg-brand`, `text-ink`, `bg-sun`, `bg-lilac`, `bg-yellow`, `border-line`…

### Mode sombre
Profil → **Apparence** : Clair / Sombre / Automatique (suit le téléphone), gardé dans `assime_apparence`. La classe `sombre` est posée sur `<html>` (dès le chargement par un petit script dans `index.html`, pour éviter un flash blanc). Le bloc `html.sombre` de `src/index.css` redéfinit les couleurs : fond `#111315`, cartes et champs `#1B1E21`, texte `#ECEEF0`, gris `#9BA1AA`, bordures `#2A2E33`. Le fond de carte Leaflet est légèrement assombri (`brightness(.72)`) ; les marqueurs ne changent pas. Le bouton orange garde son texte foncé.

### Couleur des icônes par catégorie

Icônes **Phosphor** (style duotone) sur tuile blanche. Seule l'icône est colorée :

| Teinte | Catégories |
| --- | --- |
| Violet | Pagnes wax, Église, Tout |
| Rose | Tissus, Cosmétiques, Mèches et coiffure, Favoris |
| Pêche | Épices, Sacs, Parking |
| Bleu | Friperie, Vaisselle, Banque, Grossistes |
| Jaune | Chaussures, Librairie, Artisanat, Tourisme |
| Menthe | Perles, Pharmacie, Alimentation, Pour toi |

Les correspondances sont dans `src/components/art.jsx` (`ICONES`, `TEINTE_DE`).

## Typographie

- **Space Grotesk** (700) pour les titres (`.h-display`, `font-display`).
- **Inter** (400 à 600) pour le reste.
- Tailles : titre d'écran 22–30 px, texte 14–15 px, légendes 11–12 px.

## Composants

| Classe / composant | Où | Rôle |
| --- | --- | --- |
| `.btn.btn-main` | `index.css` | Bouton orange principal (avec flèche ; `no-arrow` pour l'enlever) |
| `.card` | `index.css` | Carte blanche, coins 22 px, bordure fine |
| `.field` | `index.css` | Champ de saisie, contour vert au focus |
| `.tile` / `GlassIcon` | `index.css`, `art.jsx` | Tuile blanche avec icône colorée (noire quand sélectionnée) |
| `Wax` | `art.jsx` | Photo de boutique/article, ou fond vert clair si pas de photo |
| `Coeurs` / `VoteCoeur` | `art.jsx`, `ui.jsx` | Affichage et vote des coups de cœur |
| `BottomNav` | `ui.jsx` | Barre noire du bas, onglet actif en blanc |
| `Banner` | `ui.jsx` | Bandeau de guidage (distance, direction, son) |

## Espacement

- Marges d'écran : **20 px** (`px-5`).
- Entre deux sections : **32 à 40 px** (`mt-8`, `mt-10`).
- Entre deux cartes d'une liste : **12 à 16 px** (`gap-3`, `gap-4`).
- Aucune barre de défilement visible (`.no-scrollbar`).

## Carte

- Boutiques : **point violet**, avec le nombre de 👍 à côté.
- Repères : **rond blanc cerclé de violet**.
- Toi : **point orange**. Point de départ du trajet : rond blanc avec l'icône moto et le nom « Départ » (« Start » en anglais).
- Trajet : **vert**. Itinéraire de guidage : **orange**.
- Si la carte ne charge pas (pas de réseau), le fond reste **blanc**.
