# Guide de démo — Assimé

Parcours conseillé pour présenter l'app au jury en **3 à 4 minutes**.
À faire sur **la version en ligne (https)**, sur un téléphone, luminosité au maximum, son activé.

---

## Avant de commencer (5 min avant)

- [ ] Ouvrir le lien Vercel sur le téléphone de démo. L'installer sur l'écran d'accueil (« Ajouter à l'écran d'accueil »).
- [ ] Autoriser **la localisation** et **le micro** quand le navigateur le demande.
- [ ] Faire un essai de **« Mode démo »** pour vérifier que tout s'affiche.
- [ ] Préparer un téléphone de secours avec la même version.
- [ ] Si la salle n'a pas de réseau : la carte devient blanche, mais les points, le trajet et le guidage restent visibles.

> Pour repartir de zéro : réglages du navigateur → effacer les données du site.

---

## Le parcours

### 1. Le problème — 20 s

> « Asigamé, c'est des milliers de stands sans plan. On s'y perd, on ne retrouve plus sa moto, et les vendeurs ont du mal à être trouvés. »

### 2. Accueil et compte — 20 s

1. **Slides de découverte** (toucher « Passer » pour la dernière) : montrer le choix de langue **Éwé / Français / English** : en haut des slides, tout l'écran change tout de suite.
2. **Créer mon compte** → prénom, numéro, **Acheter** → code (taper n'importe quels 6 chiffres).

### 3. Ne plus perdre sa moto — 60 s (le moment fort)

1. Sur la **Carte**, toucher **« Mode démo »**. Le trajet se dessine depuis le parking.
2. Toucher **« Marquer un arrêt »** : le trajet se met **en pause**. Expliquer : « Je m'arrête acheter quelque chose. » Puis **« Continuer »**. « Arrêter » met aussi en pause sans quitter l'écran.
3. Toucher **« Retourner à mon point de départ »**.
4. Montrer le badge **« −xx m »** : l'app a **coupé la boucle** où l'on a tourné en rond.
5. Montrer **« Couper le son »** : la voix guide, on peut la couper.

### 4. Trouver une boutique avec l'IA — 45 s

1. Revenir à la carte, toucher **« Parler à l'IA »**.
2. Dire (ou toucher) **« Je cherche du riz en gros »**.
3. L'IA répond à voix haute et propose des boutiques avec leurs **👍**. Toucher **« Y aller »** → guidage.

### 5. Explorer et la confiance — 30 s

1. Onglet **Explorer** → filtre **Grossistes** ou **Pour toi** (choisi par l'IA).
2. Ouvrir une fiche boutique → **Coup de cœur** 👍 / 👎.
3. Expliquer la règle : « Le pouce baissé n'est **jamais affiché**. Il retire un pouce levé et part **seulement au vendeur**, pour qu'il s'améliore sans faire fuir les clients. »

### 6. Ma liste et le budget — 30 s

1. Onglet **Ma liste** : budget, dépensé, il reste.
2. **Parler à l'assistant** → « J'ai trouvé les chaussures à 8 000 ». L'article est coché, le reste se met à jour.

### 7. Côté vendeur — 30 s

1. **Profil** → **« Tu vends au marché ? »**.
2. **Modifier ma boutique** : photo de couverture, logo, « + Autre chose » pour une catégorie libre, **« Utiliser ma position GPS »**.
3. **Mes articles** : ajouter un article avec photo et prix.
4. Retour à l'espace vendeur : **Mes coups de cœur**, avec les pouces baissés visibles par lui seul.

### 8. Conclusion — 15 s

> « Assimé aide l'acheteur à ne plus se perdre, et le vendeur à être trouvé. Prochaines étapes : le relevé des allées du marché, les voix et la traduction complète en éwé, et le back-end. »

---

## Questions probables du jury

| Question | Réponse courte |
| --- | --- |
| Le GPS est-il assez précis dans le marché ? | On filtre les points imprécis (plus de 25 m d'erreur) et on enregistre le chemin réel. Le retour suit les pas, pas une ligne droite. |
| Pourquoi pas Google Maps ? | Google ne connaît ni les allées ni les stands. Assimé enregistre **ton** chemin et les vendeurs placent **eux-mêmes** leur stand. |
| Où est l'IA ? | Recherche en langage naturel, assistant de liste, sections « Pour toi », conversation vocale. Démo locale, branchée à un vrai modèle ensuite. |
| Et l'éwé ? | L'écran est traduit en partie (phrases à vérifier dans `docs/TRADUCTIONS.md`, le reste en français). Les navigateurs ne savent pas parler éwé : la voix reste en français, des fichiers audio sont prévus. |
| Comment gagner de l'argent ? | Pistes à confirmer par l'équipe : mise en avant des boutiques, outils pour grossistes, partenariats. |
| Les données des vendeurs ? | Aujourd'hui sur le téléphone. Demain sur Supabase, avec des règles d'accès : chaque vendeur ne modifie que sa boutique. |
