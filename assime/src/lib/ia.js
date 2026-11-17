// « IA » locale de démonstration.
// Elle comprend des phrases simples en français (et quelques-unes en anglais) et répond dans la langue
// choisie (en éwé : en français tant que les phrases ne sont pas traduites et vérifiées).
import { distance, fmtMoney } from './geo'
import { traduire, traduireCategorie } from '../i18n'

export const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

const SYNONYMES = {
  'Pagnes wax': ['pagne', 'wax', 'bazin', 'tissu wax', 'yards', 'loincloth'],
  Tissus: ['tissu', 'etoffe', 'bazin', 'fabric', 'cloth'],
  Épices: ['epice', 'piment', 'poivre', 'gingembre', 'condiment', 'spice', 'pepper', 'chili', 'ginger'],
  Friperie: ['fripe', 'friperie', 'vetement', 'clothes', 'clothing', 'secondhand'],
  Chaussures: ['chaussure', 'sandale', 'basket', 'soulier', 'shoe', 'sneaker', 'sandal'],
  Cosmétiques: ['cosmetique', 'creme', 'savon', 'beaute', 'parfum', 'soap', 'cream', 'beauty', 'perfume'],
  'Perles et bijoux': ['perle', 'bijou', 'collier', 'bracelet', 'bead', 'jewel', 'jewelry', 'necklace'],
  Sacs: ['sac', 'maroquinerie', 'valise', 'bag', 'handbag', 'suitcase'],
  Vaisselle: ['vaisselle', 'assiette', 'marmite', 'ustensile', 'dish', 'plate'],
  Alimentation: ['riz', 'huile', 'farine', 'sucre', 'lait', 'nourriture', 'aliment', 'alimentation', 'manger', 'tomate', 'conserve', 'haricot', 'pate', 'spaghetti', 'gari', 'igname',
    'rice', 'oil', 'flour', 'sugar', 'milk', 'food', 'beans', 'yam'],
  'Mèches et coiffure': ['meche', 'perruque', 'tresse', 'coiffure', 'cheveux', 'rajout', 'coiffeuse', 'hair', 'wig', 'braid', 'extension'],
  Artisanat: ['souvenir', 'artisanat', 'sculpture', 'masque', 'cadeau', 'touriste', 'statuette', 'panier', 'gift', 'craft', 'mask'],
}

// Mots qui ne disent rien sur ce qu'on cherche : on les ignore pour ne pas trouver
// « Boutique de pagnes » quand on dit « une boutique de chaussures », ni « Épices du marché » pour « pharmacie du marché ».
const VIDES = new Set(('je j tu il on me moi ma mon mes ta ton te un une des de du d la le les l au aux a en et ou est sont y ici la-bas '
  + 'cherche chercher cherches trouve trouver trouves veux voudrais voulais aimerais besoin acheter achete vend vendent vendre '
  + 'connais connait connaitre sais savoir montre montrer dis donne emmene emmener amene aller va vais allez stp svp merci bonjour salut '
  + 'boutique boutiques magasin magasins stand stands vendeur vendeuse endroit coin lieu place '
  + 'plus moins tres bien bon bonne pas cher chere chers petit prix proche proches pres loin cote autour '
  + 'marche grand assigame asigame assivito lome togo quartier ville ce cette ces qui que quoi quel quelle quels quelles avec pour sur dans par '
  // mots anglais qui ne disent rien sur ce qu'on cherche
  + 'i im looking look for find where is are the an some any want need buy shop shops store stores market near close cheap cheapest wholesale bulk to of in at me take show please do you know can there what which').split(' '))

const REPERES = {
  Pharmacie: ['pharmacie', 'medicament', 'malade', 'pharmacy', 'drugstore', 'medicine'], Banque: ['banque', 'ecobank', 'argent', 'retrait', 'guichet', 'bank', 'cash', 'atm'],
  Église: ['eglise', 'cathedrale', 'messe', 'sacre', 'church', 'cathedral'], Librairie: ['librairie', 'papeterie', 'livre', 'cahier', 'pasteur', 'bookshop', 'bookstore', 'book'],
  Toilettes: ['toilette', 'wc', 'pipi', 'toilet', 'restroom', 'bathroom'], Eau: ['eau', 'boire', 'soif', 'water', 'drink'], Parking: ['parking', 'garer', 'stationner', 'park'],
  'Mobile money': ['momo', 'flooz', 'tmoney', 'mobile', 'depot'], Section: ['section', 'atipoji'],
}

const mots = texte => norm(texte).split(' ').filter(Boolean)
// « chaussures » correspond à « chaussure », « sacs » à « sac », sans que « sac » ne prenne « sachet »
const colle = (mot, cle) => mot === cle || mot === cle + 's' || mot === cle + 'x' || (cle.length >= 5 && mot.startsWith(cle))

/** Devine les catégories visées par une phrase */
export function categoriesDe(texte) {
  const t = norm(texte), w = mots(texte)
  return Object.entries(SYNONYMES).filter(([, liste]) => liste.some(m => (m.includes(' ') ? t.includes(m) : w.some(x => colle(x, m))))).map(([cat]) => cat)
}

/**
 * Recherche en langage naturel : boutiques du marché ET repères (pharmacie, banque…).
 * Renvoie { reponse, resultats, lieux, inconnu } — inconnu = ce qu'on n'a pas trouvé (à chercher sur la carte de Lomé).
 */
export function rechercher(texte, boutiques, position, lieux = [], langue = 'fr') {
  const T = (k, v) => traduire(langue, k, v)
  const en = langue === 'en'
  const t = norm(texte)
  const w = mots(texte)
  const cats = categoriesDe(texte)
  const gros = /\b(en gros|grossiste|gros|wholesale|bulk)\b/.test(t)
  const pasCher = /pas cher|moins cher|petit prix|bon prix|cheap|low price/.test(t)
  const utiles = w.filter(x => x.length >= 3 && !VIDES.has(x) && !['gros', 'grossiste'].includes(x))
  const libres = utiles.filter(x => !Object.values(SYNONYMES).flat().some(m => colle(x, m)) && !Object.values(REPERES).flat().some(m => colle(x, m)))
  const dist = p => (position ? distance(position, p) : null)

  // Boutiques : par catégorie si on en reconnaît une, sinon par nom ou article
  let res = boutiques.filter(b => {
    if (cats.length) return cats.includes(b.categorie)
    if (!libres.length) return false
    const contenu = mots(b.nom + ' ' + (b.articles || []).map(a => a.nom).join(' '))
    return libres.some(x => contenu.some(c => colle(c, x) || colle(x, c)))
  })
  if (gros) res = res.filter(b => b.gros)
  res = res.map(b => ({ ...b, distance: dist(b.pos), prixMin: Math.min(...(b.articles || []).filter(a => a.stock !== false && a.prix).map(a => a.prix), Infinity) }))
  res.sort((a, b) => (pasCher ? a.prixMin - b.prixMin : (a.distance ?? 0) - (b.distance ?? 0)))

  // Repères du marché : par type (pharmacie, banque…) ou par nom (Ecobank, Bon Pasteur…)
  const types = Object.entries(REPERES).filter(([, l]) => l.some(m => w.some(x => colle(x, m)))).map(([type]) => type)
  const reperes = lieux.filter(l => types.includes(l.type) || (libres.length && libres.some(x => mots(l.nom).some(c => c.length >= 4 && (colle(c, x) || colle(x, c))))))
    .map(l => ({ ...l, distance: dist(l.pos) })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))

  const metres = d => (d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1).replace('.', en ? '.' : ',') + ' km')
  const loin = d => (d != null ? T('iaL.dist', { d: metres(d) }) : '')
  const de = x => (/^[aeiouyéèêh]/i.test(x) ? " d'" : ' de ') + x
  // En éwé, ces phrases restent en français (traduction à vérifier) : on garde donc la grammaire française
  const quoi = cats.length ? (en ? ' for ' + traduireCategorie('en', cats[0]).toLowerCase() : de(cats[0].toLowerCase())) : ''
  const enGros = gros ? T('iaL.gros') : ''
  let reponse, inconnu = null
  if (res.length) {
    reponse = T('iaL.trouve', { n: res.length, quoi, gros: enGros, tri: pasCher && res.length > 1 ? T('iaL.tri') : '' }) + ' '
      + T('iaL.premier', { qui: pasCher ? T('iaL.moinsChere') : T('iaL.plusProche'), nom: res[0].nom, dist: loin(res[0].distance) })
    if (reperes[0]) reponse += T('iaL.aussi', { nom: reperes[0].nom, dist: loin(reperes[0].distance) })
  } else if (reperes.length) {
    const r = reperes[0]
    const note = r.note && !/relever|on site/i.test(r.note) ? (en ? ': ' : ' : ') + r.note.charAt(0).toLowerCase() + r.note.slice(1) : ''
    reponse = T('iaL.repere', { nom: r.nom, dist: loin(r.distance), note })
  } else if (cats.length) {
    reponse = T('iaL.pasBoutique', { quoi, gros: enGros })
  } else {
    // on garde les mots d'origine (avec accents) : « téléphone », pas « telephone »
    const origine = texte.split(/[\s,;:!?.'’]+/).filter(m => libres.includes(norm(m)))
    inconnu = origine.join(' ') || texte.trim()
    reponse = T('iaL.inconnu', { q: inconnu })
  }
  return { reponse, resultats: res, lieux: reperes, inconnu }
}

/** Lit un montant dans une phrase : « 8 000 », « 8000 », « 8 mille », « 12k » */
export function lireMontant(texte) {
  const t = norm(texte).replace(/(\d)\s+(?=\d{3}\b)/g, '$1')
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(mille|k)?/)
  if (!m) return null
  let n = parseFloat(m[1].replace(',', '.'))
  if (m[2]) n *= 1000
  return Math.round(n)
}

function meilleurArticle(texte, liste) {
  const mots = norm(texte).split(' ').filter(w => w.length > 3)
  let best = null, score = 0
  for (const it of liste) {
    const n = norm(it.nom)
    const s = mots.filter(w => n.includes(w) || n.includes(w.replace(/s$/, ''))).length
    if (s > score) { best = it; score = s }
  }
  return best
}

export function bilan(liste, budget) {
  const depense = liste.reduce((s, it) => s + (it.fait && it.prix ? it.prix : 0), 0)
  return { depense, reste: budget - depense, restants: liste.filter(it => !it.fait) }
}

/**
 * Assistant de la liste : comprend « j'ai trouvé X à N », « coche X »,
 * « ajoute X », « combien il me reste », « si je prends X à N ».
 * Renvoie { liste, reponse, boutique? }
 */
export function assistantListe(texte, liste, budget, boutiques = [], langue = 'fr') {
  const T = (k, v) => traduire(langue, k, v)
  const t = norm(texte)
  const montant = lireMontant(texte)
  const encore = restants => (restants.length ? T('iaL.encore', { liste: restants.map(r => r.nom.toLowerCase()).join(', ') }) : T('iaL.tout'))

  if (/^(si je prends|si j achete|est ce que j ai assez|if i take|if i buy|can i afford|do i have enough)/.test(t) && montant) {
    const { reste } = bilan(liste, budget)
    const apres = reste - montant
    return { liste, reponse: apres >= 0 ? T('iaL.siOui', { m: fmtMoney(apres) }) : T('iaL.siNon', { m: fmtMoney(-apres) }) }
  }

  if (/(combien|reste|depense|budget|bilan|how much|left|spent)/.test(t) && !/(trouve|achete|pris|found|bought)/.test(t)) {
    const { depense, reste, restants } = bilan(liste, budget)
    return { liste, reponse: T('iaL.bilan', { d: fmtMoney(depense), b: fmtMoney(budget), r: fmtMoney(reste) }) + encore(restants) }
  }

  if (/^(ajoute|rajoute|note|mets|add|put)\b/.test(t)) {
    const nom = texte.replace(/^\s*(ajoute|rajoute|note|mets|add|put)\s*(moi)?\s*/i, '').replace(/\s*((a|à) (ma|la) liste|(to|on|in) (my|the) list).*$/i, '')
      .replace(/^(du|de la|de l'|des|de|le|la|les|l'|un|une|some|the|an|a)\s+/i, '').replace(/^(de l'|l')/i, '').trim()
    if (!nom) return { liste, reponse: T('iaL.quoiAjouter') }
    const nouveau = { id: Date.now(), nom: nom.charAt(0).toUpperCase() + nom.slice(1), prix: null, fait: false }
    return { liste: [...liste, nouveau], reponse: T('iaL.note', { nom: nouveau.nom }) }
  }

  if (/(trouve|achete|pris|coche|eu |found|bought|got|tick)/.test(t)) {
    let it = meilleurArticle(texte, liste)
    let base = liste
    if (!it) {
      // Article absent : on l'ajoute directement, déjà trouvé
      const m = texte.match(/(?:trouv[ée]|achet[ée]|pris|coch[ée]?|found|bought|got|ticked?)\s+(?:les?|la|l'|des|du|de la|un|une|the|some|an|a)?\s*(.+?)(?:\s+(?:a|à|pour|for|at)\s+\d.*)?$/i)
      const nom = (m ? m[1] : 'Article').trim()
      it = { id: Date.now(), nom: nom.charAt(0).toUpperCase() + nom.slice(1), prix: null, fait: false }
      base = [...liste, it]
    }
    const maj = base.map(x => (x.id === it.id ? { ...x, fait: true, prix: montant ?? x.prix } : x))
    const { depense, reste, restants } = bilan(maj, budget)
    const cats = restants.length ? categoriesDe(restants[0].nom) : []
    const prochaine = cats.length ? boutiques.find(b => b.categorie === cats[0]) : null
    return {
      liste: maj,
      reponse: T('iaL.coche', { nom: it.nom, m: montant ? ' · ' + fmtMoney(montant) : '', d: fmtMoney(depense), b: fmtMoney(budget), r: fmtMoney(reste) }) + encore(restants),
      boutique: prochaine,
    }
  }

  return { liste, reponse: T('iaL.essaie') }
}

/** Boutiques suggérées pour un article de la liste */
export function suggestions(nomArticle, boutiques) {
  const cats = categoriesDe(nomArticle)
  return boutiques.filter(b => cats.includes(b.categorie))
}

/**
 * Sections de boutiques proposées par l'IA.
 * - sans profil : tourisme, alimentation, grossistes, mèches ;
 * - selon les activités choisies (restauration, coiffure…) ;
 * - selon ce que l'utilisateur cherche et regarde (interets) : l'IA ajoute la section toute seule.
 */
export function sectionsIA({ sections, activites = [], interets = {}, boutiques = [], coeursDe = () => ({ affiches: 0 }) }) {
  const choisies = []
  const ajouter = (s, raison) => { if (!choisies.some(c => c.id === s.id)) choisies.push({ ...s, raison }) }
  if (!activites.length) ['tourisme', 'alimentation', 'grossistes', 'meches'].forEach(id => ajouter(sections.find(s => s.id === id), null))
  activites.forEach(a => sections.filter(s => s.pour.includes(a)).forEach(s => ajouter(s, 'Pour ton activité')))
  Object.entries(interets).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([cat]) => {
    if (choisies.some(c => c.cats.includes(cat))) return
    const s = sections.find(x => x.cats.includes(cat) && !x.gros)
    ajouter(s || { id: 'cat-' + cat, titre: cat, sous: 'Section créée pour toi', cats: [cat], pour: [] }, `Ajoutée par l'IA : tu t'intéresses à « ${cat.toLowerCase()} »`)
  })
  return choisies.map(s => ({
    ...s,
    boutiques: boutiques.filter(b => s.cats.includes(b.categorie) && (!s.gros || b.gros))
      .sort((a, b) => coeursDe(b.id).affiches - coeursDe(a.id).affiches),
  })).filter(s => s.boutiques.length)
}

// ---------------------------------------------------------------------------
// Vraie IA (Gemini) via la fonction serveur /api/ia.
// Renvoie null si le serveur, la clé ou le réseau manquent : l'app utilise alors l'IA locale ci-dessus.
// ---------------------------------------------------------------------------

/** Contexte envoyé à l'agent : catalogue, repères, position, liste, budget, coups de cœur, derniers échanges.
 *  Les distances sont calculées côté serveur par les outils, à partir des positions. */
export function contexteIA({ message, boutiques, lieux = [], position, liste = [], budget = 0, moto, coeursDe = () => ({ affiches: 0 }), historique = [], langue = 'fr' }) {
  return {
    message, langue,
    position: position || null,
    boutiques: boutiques.map(b => ({
      id: b.id, nom: b.nom, categorie: b.categorie, gros: !!b.gros, verifiee: !!b.verifiee, pos: b.pos,
      horaires: b.horaires, repere: b.repere, zone: b.zone, telephone: b.telephone ? 'oui' : '', whatsapp: b.whatsapp ? 'oui' : '',
      articles: (b.articles || []).map(a => ({ nom: a.nom, prix: a.prix ?? null, stock: a.stock !== false })),
    })),
    lieux: lieux.map(l => ({ id: l.id, nom: l.nom, type: l.type, note: l.note, pos: l.pos })),
    coeurs: Object.fromEntries(boutiques.map(b => [b.id, coeursDe(b.id).affiches])),
    liste: liste.map(({ id, nom, prix, fait }) => ({ id, nom, prix, fait })),
    budget, moto: !!moto,
    historique: historique.slice(-6).map(h => ({ de: h.de, texte: h.texte })),
  }
}

export async function demanderIA(params, { delai = 25000 } = {}) {
  const ctrl = new AbortController()
  const minuteur = setTimeout(() => ctrl.abort(), delai)
  try {
    const r = await fetch('/api/ia', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contexteIA(params)), signal: ctrl.signal,
    })
    if (!r.ok) return null
    const data = await r.json()
    return data && typeof data.reponse === 'string' ? data : null
  } catch {
    return null
  } finally {
    clearTimeout(minuteur)
  }
}

/** Libellés des outils utilisés par l'agent, affichés sous la réponse */
export const NOMS_OUTILS = {
  chercher_boutiques: 'Boutiques', comparer_prix: 'Prix comparés', details_boutique: 'Fiche boutique', chercher_reperes: 'Repères',
  chercher_sur_carte_lome: 'Carte de Lomé', calculer_trajet: 'Trajet', etat_liste: 'Ma liste', recherche_web: 'Internet',
}

/** Applique à la liste les opérations proposées par l'IA (ajouter, cocher, retirer) */
export function appliquerOperations(liste, operations = []) {
  let l = [...liste]
  const trouve = nom => {
    const n = norm(nom)
    return l.findIndex(x => norm(x.nom) === n || norm(x.nom).includes(n) || n.includes(norm(x.nom)))
  }
  for (const op of operations) {
    if (!op?.nom) continue
    const prix = Number.isFinite(Number(op.prix)) && Number(op.prix) > 0 ? Math.round(Number(op.prix)) : null
    const i = trouve(op.nom)
    const nom = String(op.nom).charAt(0).toUpperCase() + String(op.nom).slice(1)
    if (op.type === 'retirer') { if (i >= 0) l.splice(i, 1); continue }
    if (op.type === 'cocher') {
      if (i >= 0) l[i] = { ...l[i], fait: true, prix: prix ?? l[i].prix }
      else l.push({ id: Date.now() + l.length, nom, prix, fait: true })
      continue
    }
    if (op.type === 'ajouter' && i < 0) l.push({ id: Date.now() + l.length, nom, prix, fait: !!op.fait })
  }
  return l
}

/** Phrase exacte sur le budget, calculée par l'app (jamais par le modèle) */
export function phraseBudget(liste, budget, langue = 'fr') {
  const { depense, reste } = bilan(liste, budget)
  return reste >= 0
    ? traduire(langue, 'iaL.budgetOk', { d: fmtMoney(depense), r: fmtMoney(reste) })
    : traduire(langue, 'iaL.budgetDepasse', { d: fmtMoney(depense), r: fmtMoney(-reste) })
}
