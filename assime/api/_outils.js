// Outils que Gemini peut appeler (« function calling »).
// Fichier préfixé par « _ » : Vercel ne le publie pas comme une route, il sert seulement à api/ia.js.
// Règle d'or : les calculs (distances, prix, budget) sont faits ICI, en code, jamais par le modèle.
import { distance, bearing, directionName } from '../src/lib/geo.js'

const LOME = '1.15,6.22,1.32,6.10' // ouest, nord, est, sud
const VITESSE_PIETON = 70 // mètres par minute dans un marché animé

const sansAccent = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const contient = (texte, cherche) => {
  const t = sansAccent(texte)
  return sansAccent(cherche).split(/\s+/).filter(m => m.length >= 3).some(m => t.includes(m.replace(/s$/, '')))
}
const metres = (pos, cible) => (pos && cible ? Math.round(distance(pos, cible)) : null)
const minutes = m => (m == null ? null : Math.max(1, Math.round(m / VITESSE_PIETON)))

/** Déclarations envoyées à Gemini : ce que chaque outil fait et ses paramètres */
export const DECLARATIONS = [
  {
    name: 'chercher_boutiques',
    description: "Cherche des boutiques du Grand Marché d'Asigamé par catégorie, article ou nom. Renvoie distance à pied, prix des articles correspondants, stock, coups de cœur et horaires.",
    parameters: {
      type: 'object',
      properties: {
        requete: { type: 'string', description: "Article ou nom cherché, ex. « riz », « chaussures enfant », « Belle Afi »" },
        categorie: { type: 'string', description: 'Catégorie exacte si connue (voir la liste des catégories)' },
        en_gros: { type: 'boolean', description: 'true pour ne garder que les grossistes' },
        prix_max: { type: 'number', description: 'Prix maximum en FCFA' },
        tri: { type: 'string', enum: ['distance', 'prix', 'coeurs'], description: 'Ordre des résultats' },
      },
    },
  },
  {
    name: 'comparer_prix',
    description: "Compare le prix d'un article dans toutes les boutiques qui le vendent, du moins cher au plus cher, avec la distance.",
    parameters: { type: 'object', properties: { article: { type: 'string' } }, required: ['article'] },
  },
  {
    name: 'details_boutique',
    description: "Tous les détails d'une boutique : articles, prix, stock, horaires, repère pour la trouver, contact disponible.",
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'chercher_reperes',
    description: 'Cherche les repères du marché : pharmacie, banque, cathédrale, toilettes, parking, mobile money, point d\'eau, sections.',
    parameters: { type: 'object', properties: { requete: { type: 'string', description: 'ex. « pharmacie », « Ecobank », « toilettes »' } }, required: ['requete'] },
  },
  {
    name: 'chercher_sur_carte_lome',
    description: "Cherche un lieu de Lomé HORS du marché (supermarché Ramco, banque, hôtel, rue, quartier) sur OpenStreetMap. Renvoie adresse et distance.",
    parameters: { type: 'object', properties: { requete: { type: 'string' } }, required: ['requete'] },
  },
  {
    name: 'calculer_trajet',
    description: "Calcule la distance à pied, le temps et la direction depuis la position de l'utilisateur vers une boutique, un repère ou des coordonnées.",
    parameters: {
      type: 'object',
      properties: {
        destination_id: { type: 'string', description: "id d'une boutique ou d'un repère" },
        lat: { type: 'number' }, lng: { type: 'number' },
      },
    },
  },
  {
    name: 'etat_liste',
    description: "Donne la liste de courses actuelle, le budget, ce qui est dépensé et ce qui reste (calcul exact).",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'recherche_web',
    description: "Cherche une information récente sur internet (prix du marché, horaires d'un lieu de Lomé, actualité). À utiliser seulement si les autres outils ne suffisent pas.",
    parameters: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] },
  },
  {
    name: 'repondre',
    description: "OBLIGATOIRE pour terminer : donne la réponse finale à lire à voix haute et ce que l'application doit afficher.",
    parameters: {
      type: 'object',
      properties: {
        reponse: { type: 'string', description: 'Réponse en français simple, tutoiement, 1 à 3 phrases courtes, lue à voix haute' },
        boutiques: { type: 'array', items: { type: 'string' }, description: 'ids des boutiques à afficher (3 maximum)' },
        lieux: { type: 'array', items: { type: 'string' }, description: 'ids des repères du marché à afficher (2 maximum)' },
        lieux_lome: { type: 'array', items: { type: 'string' }, description: 'ids des lieux trouvés avec chercher_sur_carte_lome à afficher' },
        operations: {
          type: 'array',
          description: 'Changements à faire dans la liste de courses',
          items: {
            type: 'object',
            properties: { type: { type: 'string', enum: ['ajouter', 'cocher', 'retirer'] }, nom: { type: 'string' }, prix: { type: 'number' } },
            required: ['type', 'nom'],
          },
        },
        parler_budget: { type: 'boolean', description: "true si la réponse concerne l'argent : l'app ajoute la phrase exacte du budget" },
        action: { type: 'string', enum: ['aucune', 'retour_moto', 'voir_liste'] },
      },
      required: ['reponse'],
    },
  },
]

/** Exécute un outil. ctx = { boutiques, lieux, position, liste, budget, coeurs, cle, modele, memo } */
export async function executer(nom, args = {}, ctx) {
  const pos = ctx.position
  const resume = b => ({
    id: b.id, nom: b.nom, categorie: b.categorie, en_gros: !!b.gros, verifiee: !!b.verifiee,
    distance_m: metres(pos, b.pos), minutes_a_pied: minutes(metres(pos, b.pos)), coeurs: ctx.coeurs?.[b.id] ?? 0, horaires: b.horaires || null,
  })

  switch (nom) {
    case 'chercher_boutiques': {
      let res = ctx.boutiques.filter(b => {
        if (args.categorie && sansAccent(b.categorie) !== sansAccent(args.categorie)) return false
        if (args.en_gros && !b.gros) return false
        if (args.requete) {
          const texte = [b.nom, b.categorie, ...(b.articles || []).map(a => a.nom)].join(' ')
          if (!contient(texte, args.requete)) return false
        }
        return true
      }).map(b => {
        const articles = (b.articles || []).filter(a => !args.requete || contient(a.nom + ' ' + b.categorie, args.requete))
          .filter(a => !args.prix_max || !a.prix || a.prix <= args.prix_max)
          .map(a => ({ nom: a.nom, prix: a.prix ?? null, en_stock: a.stock !== false }))
        return { ...resume(b), articles: articles.length ? articles : (b.articles || []).slice(0, 4).map(a => ({ nom: a.nom, prix: a.prix ?? null, en_stock: a.stock !== false })) }
      })
      if (args.prix_max) res = res.filter(b => b.articles.some(a => !a.prix || a.prix <= args.prix_max))
      const prixMin = b => Math.min(...b.articles.filter(a => a.prix && a.en_stock).map(a => a.prix), Infinity)
      res.sort(args.tri === 'prix' ? (a, b) => prixMin(a) - prixMin(b) : args.tri === 'coeurs' ? (a, b) => b.coeurs - a.coeurs : (a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0))
      return { nombre: res.length, boutiques: res.slice(0, 6) }
    }

    case 'comparer_prix': {
      const offres = []
      for (const b of ctx.boutiques) for (const a of b.articles || []) {
        if (a.prix && contient(a.nom + ' ' + b.categorie, args.article)) offres.push({ boutique_id: b.id, boutique: b.nom, article: a.nom, prix: a.prix, en_stock: a.stock !== false, distance_m: metres(pos, b.pos) })
      }
      offres.sort((x, y) => x.prix - y.prix)
      return { article: args.article, nombre: offres.length, offres: offres.slice(0, 8), ecart: offres.length > 1 ? offres[offres.length - 1].prix - offres[0].prix : 0 }
    }

    case 'details_boutique': {
      const b = ctx.boutiques.find(x => x.id === args.id)
      if (!b) return { erreur: 'Boutique inconnue' }
      return { ...resume(b), repere: b.repere || null, zone: b.zone || null, a_un_contact: !!(b.telephone || b.whatsapp),
        articles: (b.articles || []).map(a => ({ nom: a.nom, prix: a.prix ?? null, en_stock: a.stock !== false })) }
    }

    case 'chercher_reperes': {
      const res = ctx.lieux.filter(l => contient([l.nom, l.type, l.note].join(' '), args.requete))
        .map(l => ({ id: l.id, nom: l.nom, type: l.type, indication: l.note, distance_m: metres(pos, l.pos), minutes_a_pied: minutes(metres(pos, l.pos)) }))
        .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0))
      return { nombre: res.length, reperes: res.slice(0, 4) }
    }

    case 'chercher_sur_carte_lome': {
      const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
        q: args.requete, format: 'jsonv2', limit: '5', viewbox: LOME, bounded: '1', 'accept-language': 'fr', countrycodes: 'tg',
      })
      try {
        const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Assime/1.2 (hackathon CREATE WITH AI, Lome)' } })
        if (!r.ok) return { erreur: 'Carte indisponible' }
        const lieux = (await r.json()).map(d => {
          const p = [Number(d.lat), Number(d.lon)]
          return { id: 'osm-' + d.place_id, nom: d.name || d.display_name.split(',')[0], adresse: d.display_name.split(',').slice(1, 3).join(',').trim(), pos: p, distance_m: metres(pos, p) }
        })
        lieux.forEach(l => { ctx.memo.lome[l.id] = l })
        return { nombre: lieux.length, lieux: lieux.map(({ pos: _p, ...l }) => l) }
      } catch {
        return { erreur: 'Carte indisponible' }
      }
    }

    case 'calculer_trajet': {
      if (!pos) return { erreur: "Position de l'utilisateur inconnue" }
      const cible = ctx.boutiques.find(b => b.id === args.destination_id) || ctx.lieux.find(l => l.id === args.destination_id) || ctx.memo.lome[args.destination_id]
      const p = cible?.pos || (Number.isFinite(args.lat) && Number.isFinite(args.lng) ? [args.lat, args.lng] : null)
      if (!p) return { erreur: 'Destination inconnue' }
      const m = metres(pos, p)
      return { destination: cible?.nom || 'coordonnées', distance_m: m, minutes_a_pied: minutes(m), direction: directionName(bearing(pos, p)), note: "Distance à vol d'oiseau : le chemin réel dans les allées peut être un peu plus long." }
    }

    case 'etat_liste': {
      const liste = ctx.liste || []
      const depense = liste.reduce((s, it) => s + (it.fait && it.prix ? it.prix : 0), 0)
      return { budget: ctx.budget, depense, reste: (ctx.budget || 0) - depense,
        trouves: liste.filter(i => i.fait).map(i => ({ nom: i.nom, prix: i.prix })), a_trouver: liste.filter(i => !i.fait).map(i => i.nom) }
    }

    case 'recherche_web': {
      // Sous-appel à Gemini avec l'outil Google Search intégré
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${ctx.modele}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ctx.cle },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `Réponds en français, en 2 phrases maximum, pour quelqu'un à Lomé (Togo) : ${args.question}` }] }],
            tools: [{ google_search: {} }],
            generationConfig: { maxOutputTokens: 300 },
          }),
        })
        if (!r.ok) return { erreur: 'Recherche internet indisponible (' + r.status + ')' }
        const d = await r.json()
        const c = d?.candidates?.[0]
        const texte = c?.content?.parts?.map(p => p.text || '').join('').trim()
        const sources = (c?.groundingMetadata?.groundingChunks || []).map(g => g.web).filter(Boolean).slice(0, 3).map(w => ({ titre: w.title, url: w.uri }))
        ctx.memo.sources.push(...sources)
        return { resultat: texte || 'Rien trouvé', sources: sources.map(s => s.titre) }
      } catch {
        return { erreur: 'Recherche internet indisponible' }
      }
    }

    default:
      return { erreur: 'Outil inconnu : ' + nom }
  }
}
