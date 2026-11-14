# Mise en ligne — pas à pas

Objectif : obtenir un lien **https** (obligatoire pour le GPS et le micro) à rendre pour le hackathon.

---

## Option A — Vercel + GitHub (recommandée)

1. **GitHub**
   ```bash
   git init
   git add .
   git commit -m "Assimé v1.0.0"
   git branch -M main
   git remote add origin https://github.com/<compte>/assime.git
   git push -u origin main
   ```
2. **Vercel** → [vercel.com/new](https://vercel.com/new) → se connecter avec GitHub → **Import** le dépôt `assime`.
3. Réglages (détectés automatiquement) :
   | Réglage | Valeur |
   | --- | --- |
   | Framework | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |
4. Ouvrir **Environment Variables** et ajouter `GEMINI_API_KEY` = ta clé Gemini ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)).
5. **Deploy**. Le lien ressemble à `https://assime.vercel.app`.
6. Ensuite, chaque `git push` sur `main` met le site à jour tout seul.

## Option B — Vercel en ligne de commande

```bash
npm i -g vercel
vercel          # première fois : répondre aux questions
vercel --prod   # mise en production
```

## Option C — Netlify (glisser-déposer)

> ⚠️ Avec le glisser-déposer, la fonction `api/ia.js` n'est pas déployée : l'app utilisera l'IA locale. Préférer Vercel.

1. `npm run build`
2. Sur [app.netlify.com/drop](https://app.netlify.com/drop), glisser le dossier **`dist`**.
3. Les liens directs marchent déjà grâce au fichier `public/_redirects` (copié dans `dist`).

---

## Vérifications après la mise en ligne

- [ ] Le lien s'ouvre sur le téléphone, en **https**.
- [ ] Le navigateur demande la **localisation**. La carte affiche le point orange.
- [ ] La vue **satellite** s'affiche (réseau nécessaire).
- [ ] Le **micro** marche dans « Parler à l'IA » (Chrome Android ou Safari iOS).
- [ ] Les réponses de l'IA portent l'étiquette **✦ Gemini** (sinon : clé absente, voir [`IA.md`](IA.md)).
- [ ] Ouvrir directement `…/carte` fonctionne (pas d'erreur 404).
- [ ] « Ajouter à l'écran d'accueil » installe l'icône Assimé.

## Dépannage

| Problème | Cause probable | Solution |
| --- | --- | --- |
| Page blanche | Erreur de build | Lancer `npm run build` en local et lire l'erreur |
| 404 sur `/carte` | Redirections absentes | Vérifier `vercel.json` (ou `_redirects` sur Netlify) |
| « Position simulée » au marché | GPS refusé, ou pas en https | Autoriser la localisation dans les réglages du navigateur |
| Micro grisé | Navigateur non compatible | Utiliser Chrome (Android) ou Safari (iOS) |
| Carte blanche | Pas de réseau | Normal : les points et le trajet restent visibles |
| Anciennes données affichées | Cache du navigateur | Effacer les données du site, puis recharger |
| `npm install` échoue | Node trop ancien | Installer Node 20.19 ou plus récent (`nvm use`) |
