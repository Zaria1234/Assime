// Fonction serveur Vercel : POST /api/ia — l'agent Gemini d'Assimé.
// Gemini reçoit la phrase, décide quels outils appeler (boutiques, prix, trajet, carte de Lomé, internet…),
// lit leurs résultats, puis termine en appelant l'outil « repondre ».
// La clé GEMINI_API_KEY reste sur le serveur : elle n'est jamais envoyée au navigateur.
import { DECLARATIONS, executer } from './_outils.js'

const MODELE_DEFAUT = 'gemini-flash-latest' // alias Google qui suit le dernier modèle Flash
const MODELE_SECOURS = 'gemini-flash-lite-latest' // utilisé si le modèle principal est surchargé (503/429) ou absent (404)
const ETAPES_MAX = 6 // nombre maximum d'allers-retours avec les outils

const CONSIGNES = `Tu es l'assistant vocal d'Assimé, l'application qui guide les gens au Grand Marché d'Asigamé à Lomé (Togo).
Tu parles français simple, avec le tutoiement. Ta réponse est lue à voix haute : 1 à 3 phrases courtes, chiffres arrondis, pas de listes.

Méthode :
1. Comprends ce que la personne veut vraiment. Les mots « boutique », « marché », « Togo » seuls ne désignent rien.
2. Utilise les outils pour aller chercher les faits. Tu peux en appeler plusieurs, en plusieurs étapes. N'invente JAMAIS une boutique, un lieu, un prix, une distance ou un horaire.
   - Un article ou une catégorie → chercher_boutiques (tri « prix » si on veut pas cher, « distance » pour le plus proche).
   - « Où c'est le moins cher ? », comparer → comparer_prix.
   - Pharmacie, banque, toilettes, église, parking, mobile money → chercher_reperes.
   - Un lieu hors du marché (Ramco, un hôtel, une rue de Lomé) → chercher_sur_carte_lome.
   - Distance, temps, direction → calculer_trajet.
   - Budget, liste → etat_liste (les montants de cet outil sont exacts, recopie-les tels quels).
   - Information récente ou générale sur Lomé → recherche_web, en dernier recours.
3. Termine TOUJOURS en appelant « repondre ».
   - Mets dans boutiques / lieux / lieux_lome les ids à afficher (avec « Y aller » dans l'app).
   - « J'ai trouvé / acheté X à N » → operations [{type: "cocher", nom: X, prix: N}] (si X n'est pas dans la liste, l'app l'ajoute déjà cochée).
   - « Ajoute X » → "ajouter". « Enlève X » → "retirer". Plusieurs articles → plusieurs opérations.
   - Question d'argent → parler_budget = true (l'app ajoute elle-même la phrase exacte : ne répète pas les montants).
   - « Ramène-moi à ma moto » → action "retour_moto" si moto = true, sinon explique qu'il faut d'abord enregistrer le trajet.
4. Si rien ne correspond, dis-le simplement et propose une autre piste.`

/** Appel à Gemini, avec bascule sur le modèle de secours si le principal est indisponible */
async function gemini(ctx, corps) {
  try {
    return await appelGemini(ctx.cle, ctx.modele, corps, 8000)
  } catch (e) {
    if (![404, 429, 500, 503, 504].includes(e.statut) || ctx.modele === MODELE_SECOURS) throw e
    ctx.modele = MODELE_SECOURS // les étapes suivantes restent sur le secours
    return appelGemini(ctx.cle, ctx.modele, corps)
  }
}

/** Appel brut à Gemini */
async function appelGemini(cle, modele, corps, delai = 15000) {
  // Délai maximum : un modèle surchargé peut ne jamais répondre (Vercel coupe à 30 s)
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
    body: JSON.stringify(corps),
    signal: AbortSignal.timeout(delai),
  }).catch(e => { throw Object.assign(new Error('Gemini trop lent (' + modele + ')'), { statut: e.name === 'TimeoutError' ? 504 : 502 }) })
  if (!r.ok) throw Object.assign(new Error('Gemini a répondu ' + r.status), { statut: r.status, detail: (await r.text().catch(() => '')).slice(0, 300) })
  return r.json()
}

/** Cœur de l'agent, indépendant de Vercel (testable et réutilisé en local par Vite) */
export async function repondreIA(corps, env = process.env) {
  const cle = env.GEMINI_API_KEY
  if (!cle) return { statut: 503, json: { erreur: 'GEMINI_API_KEY manquante sur le serveur' } }
  const message = String(corps?.message || '').slice(0, 500).trim()
  if (!message) return { statut: 400, json: { erreur: 'message vide' } }

  const modele = env.GEMINI_MODEL || MODELE_DEFAUT
  const ctx = {
    cle, modele,
    boutiques: (corps.boutiques || []).slice(0, 300),
    lieux: (corps.lieux || []).slice(0, 50),
    position: Array.isArray(corps.position) && corps.position.length === 2 ? corps.position.map(Number) : null,
    liste: (corps.liste || []).slice(0, 80),
    budget: Number(corps.budget) || 0,
    coeurs: corps.coeurs || {},
    memo: { lome: {}, sources: [] },
  }
  const categories = [...new Set(ctx.boutiques.map(b => b.categorie))].join(', ')
  const situation = `Catégories de boutiques : ${categories}.\nPosition connue : ${ctx.position ? 'oui' : 'non'}. Moto enregistrée : ${corps.moto ? 'oui' : 'non'}. Articles dans la liste : ${ctx.liste.length}.`

  // Mémoire de la conversation (derniers échanges)
  const historique = (corps.historique || []).slice(-6).filter(h => h?.texte)
    .map(h => ({ role: h.de === 'moi' ? 'user' : 'model', parts: [{ text: String(h.texte).slice(0, 400) }] }))
  // Gemini veut une conversation qui commence par l'utilisateur
  while (historique.length && historique[0].role !== 'user') historique.shift()

  const contents = [...historique, { role: 'user', parts: [{ text: `${situation}\n\nMessage : ${message}` }] }]
  const outilsUtilises = []
  let finale = null

  try {
    for (let etape = 0; etape < ETAPES_MAX && !finale; etape++) {
      const derniere = etape === ETAPES_MAX - 1
      const data = await gemini(ctx, {
        systemInstruction: { parts: [{ text: CONSIGNES }] },
        contents,
        tools: [{ functionDeclarations: DECLARATIONS }],
        // ANY : Gemini doit toujours appeler un outil. À la dernière étape, seulement « repondre ».
        toolConfig: { functionCallingConfig: derniere ? { mode: 'ANY', allowedFunctionNames: ['repondre'] } : { mode: 'ANY' } },
        generationConfig: { maxOutputTokens: 800 },
      })
      const contenu = data?.candidates?.[0]?.content
      const appels = (contenu?.parts || []).filter(p => p.functionCall).map(p => p.functionCall)
      if (!appels.length) {
        // Pas d'appel d'outil : on prend le texte tel quel
        const texte = (contenu?.parts || []).map(p => p.text || '').join('').trim()
        finale = { reponse: texte || "Je n'ai pas bien compris. Tu peux répéter ?" }
        break
      }
      contents.push(contenu) // on renvoie la réponse du modèle telle quelle (signatures de réflexion incluses)
      const reponses = []
      for (const appel of appels) {
        if (appel.name === 'repondre') { finale = appel.args || {}; break }
        outilsUtilises.push(appel.name)
        const resultat = await executer(appel.name, appel.args || {}, ctx)
        reponses.push({ functionResponse: { name: appel.name, response: { resultat } } })
      }
      if (!finale) contents.push({ role: 'user', parts: reponses })
    }
  } catch (e) {
    return { statut: e.statut ? 502 : 500, json: { erreur: e.message, detail: e.detail || '' } }
  }

  // Pas de réponse finale : on renvoie une erreur pour que l'app passe sur l'IA locale
  if (!finale) return { statut: 504, json: { erreur: "Gemini n'a pas conclu", outils: [...new Set(outilsUtilises)] } }
  const idsB = new Set(ctx.boutiques.map(b => b.id))
  const idsL = new Set(ctx.lieux.map(l => l.id))
  return {
    statut: 200,
    json: {
      reponse: String(finale.reponse || '').slice(0, 600) || "Je n'ai pas bien compris. Tu peux répéter ?",
      boutiques: (finale.boutiques || []).filter(id => idsB.has(id)).slice(0, 3), // jamais de boutique inventée
      lieux: (finale.lieux || []).filter(id => idsL.has(id)).slice(0, 2),
      lieux_lome: (finale.lieux_lome || []).map(id => ctx.memo.lome[id]).filter(Boolean).slice(0, 3), // seulement ceux vraiment trouvés
      operations: Array.isArray(finale.operations) ? finale.operations.slice(0, 10) : [],
      parler_budget: !!finale.parler_budget,
      action: ['retour_moto', 'voir_liste'].includes(finale.action) ? finale.action : 'aucune',
      outils: [...new Set(outilsUtilises)],
      sources: ctx.memo.sources.slice(0, 3),
      modele: ctx.modele,
    },
  }
}

/** Point d'entrée Vercel */
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ erreur: 'POST uniquement' }) }
  try {
    const corps = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const { statut, json } = await repondreIA(corps)
    res.status(statut).json(json)
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur interne', detail: String(e?.message || e).slice(0, 200) })
  }
}
