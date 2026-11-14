// « IA » locale de démonstration.
// Elle comprend des phrases simples en français. Le jour J, on remplace
// l'intérieur de ces fonctions par un appel à un vrai modèle (via une
// fonction Vercel, pour ne jamais exposer la clé d'API dans le front).
import { distance, fmtMoney } from './geo'

export const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

const SYNONYMES = {
  'Pagnes wax': ['pagne', 'wax', 'bazin', 'tissu wax', 'yards'],
  Tissus: ['tissu', 'etoffe', 'bazin'],
  Épices: ['epice', 'piment', 'poivre', 'gingembre', 'condiment'],
  Friperie: ['fripe', 'friperie', 'vetement'],
  Chaussures: ['chaussure', 'sandale', 'basket', 'soulier'],
  Cosmétiques: ['cosmetique', 'creme', 'savon', 'beaute', 'parfum'],
  'Perles et bijoux': ['perle', 'bijou', 'collier', 'bracelet'],
  Sacs: ['sac', 'maroquinerie', 'valise'],
  Vaisselle: ['vaisselle', 'assiette', 'marmite', 'ustensile'],
  Alimentation: ['riz', 'huile', 'farine', 'sucre', 'lait', 'nourriture', 'aliment', 'alimentation', 'manger', 'tomate', 'conserve', 'haricot', 'pate', 'spaghetti', 'gari', 'igname'],
  'Mèches et coiffure': ['meche', 'perruque', 'tresse', 'coiffure', 'cheveux', 'rajout', 'coiffeuse'],
  Artisanat: ['souvenir', 'artisanat', 'sculpture', 'masque', 'cadeau', 'touriste', 'statuette', 'panier'],
}

// Mots qui ne disent rien sur ce qu'on cherche : on les ignore pour ne pas trouver
// « Boutique de pagnes » quand on dit « une boutique de chaussures », ni « Épices du marché » pour « pharmacie du marché ».
const VIDES = new Set(('je j tu il on me moi ma mon mes ta ton te un une des de du d la le les l au aux a en et ou est sont y ici la-bas '
  + 'cherche chercher cherches trouve trouver trouves veux voudrais voulais aimerais besoin acheter achete vend vendent vendre '
  + 'connais connait connaitre sais savoir montre montrer dis donne emmene emmener amene aller va vais allez stp svp merci bonjour salut '
  + 'boutique boutiques magasin magasins stand stands vendeur vendeuse endroit coin lieu place '
  + 'plus moins tres bien bon bonne pas cher chere chers petit prix proche proches pres loin cote autour '
  + 'marche grand assigame asigame assivito lome togo quartier ville ce cette ces qui que quoi quel quelle quels quelles avec pour sur dans par').split(' '))

const REPERES = {
  Pharmacie: ['pharmacie', 'medicament', 'malade'], Banque: ['banque', 'ecobank', 'argent', 'retrait', 'guichet'],
  Église: ['eglise', 'cathedrale', 'messe', 'sacre'], Librairie: ['librairie', 'papeterie', 'livre', 'cahier', 'pasteur'],
  Toilettes: ['toilette', 'wc', 'pipi'], Eau: ['eau', 'boire', 'soif'], Parking: ['parking', 'garer', 'stationner'],
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
export function rechercher(texte, boutiques, position, lieux = []) {
  const t = norm(texte)
  const w = mots(texte)
  const cats = categoriesDe(texte)
  const gros = /\b(en gros|grossiste|gros)\b/.test(t)
  const pasCher = /pas cher|moins cher|petit prix|bon prix/.test(t)
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

  const loin = d => (d != null ? ', à ' + (d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1).replace('.', ',') + ' km') : '')
  const de = x => (/^[aeiouyéèêh]/i.test(x) ? " d'" : ' de ') + x
  const quoi = cats.length ? de(cats[0].toLowerCase()) : ''
  let reponse, inconnu = null
  if (res.length) {
    reponse = `J'ai trouvé ${res.length} boutique${res.length > 1 ? 's' : ''}${quoi}${gros ? ' en gros' : ''}${pasCher ? ', de la moins chère à la plus chère' : ''}. `
      + `${pasCher ? 'La moins chère' : 'La plus proche'} : ${res[0].nom}${loin(res[0].distance)}.`
    if (reperes[0]) reponse += ` Il y a aussi ${reperes[0].nom}${loin(reperes[0].distance)}.`
  } else if (reperes.length) {
    reponse = `${reperes[0].nom}${loin(reperes[0].distance)}${reperes[0].note && !/relever/i.test(reperes[0].note) ? ' : ' + reperes[0].note.charAt(0).toLowerCase() + reperes[0].note.slice(1) : ''}. Je t'y emmène ?`
  } else if (cats.length) {
    reponse = `Je n'ai pas encore de boutique${quoi}${gros ? ' en gros' : ''} sur Assimé.`
  } else {
    // on garde les mots d'origine (avec accents) : « téléphone », pas « telephone »
    const origine = texte.split(/[\s,;:!?.'’]+/).filter(m => libres.includes(norm(m)))
    inconnu = origine.join(' ') || texte.trim()
    reponse = `Je ne connais pas encore « ${inconnu} » dans le marché. Je peux le chercher sur la carte de Lomé.`
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
export function assistantListe(texte, liste, budget, boutiques = []) {
  const t = norm(texte)
  const montant = lireMontant(texte)

  if (/^(si je prends|si j achete|est ce que j ai assez)/.test(t) && montant) {
    const { reste } = bilan(liste, budget)
    const apres = reste - montant
    return { liste, reponse: apres >= 0 ? `Oui. Après ça, il te resterait ${fmtMoney(apres)} FCFA.` : `Non, il te manquerait ${fmtMoney(-apres)} FCFA.` }
  }

  if (/(combien|reste|depense|budget|bilan)/.test(t) && !/(trouve|achete|pris)/.test(t)) {
    const { depense, reste, restants } = bilan(liste, budget)
    return { liste, reponse: `Tu as dépensé ${fmtMoney(depense)} sur ${fmtMoney(budget)} FCFA. Il te reste ${fmtMoney(reste)}.` + (restants.length ? ` Encore à trouver : ${restants.map(r => r.nom.toLowerCase()).join(', ')}.` : ' Tu as tout trouvé !') }
  }

  if (/^(ajoute|rajoute|note|mets)/.test(t)) {
    const nom = texte.replace(/^\s*(ajoute|rajoute|note|mets)\s*(moi)?\s*/i, '').replace(/\s*(a|à) (ma|la) liste.*$/i, '').replace(/^(du|de la|de l'|des|de|le|la|les|l'|un|une)\s*/i, '').trim()
    if (!nom) return { liste, reponse: 'Dis-moi ce que je dois ajouter.' }
    const nouveau = { id: Date.now(), nom: nom.charAt(0).toUpperCase() + nom.slice(1), prix: null, fait: false }
    return { liste: [...liste, nouveau], reponse: `C'est noté : ${nouveau.nom}.` }
  }

  if (/(trouve|achete|pris|coche|eu )/.test(t)) {
    let it = meilleurArticle(texte, liste)
    let base = liste
    if (!it) {
      // Article absent : on l'ajoute directement, déjà trouvé
      const m = texte.match(/(?:trouv[ée]|achet[ée]|pris|coch[ée]?)\s+(?:les?|la|l'|des|du|de la|un|une)?\s*(.+?)(?:\s+(?:a|à|pour)\s+\d.*)?$/i)
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
      reponse: `${it.nom} coché${montant ? ' · ' + fmtMoney(montant) : ''}. Tu as dépensé ${fmtMoney(depense)} sur ${fmtMoney(budget)}, il te reste ${fmtMoney(reste)}.` + (restants.length ? ` Il te reste à trouver : ${restants.map(r => r.nom.toLowerCase()).join(', ')}.` : ' Tu as tout trouvé !'),
      boutique: prochaine,
    }
  }

  return { liste, reponse: 'Essaie : « j\'ai trouvé les chaussures à 8 000 », « ajoute du savon » ou « combien il me reste ? »' }
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
export function contexteIA({ message, boutiques, lieux = [], position, liste = [], budget = 0, moto, coeursDe = () => ({ affiches: 0 }), historique = [] }) {
  return {
    message,
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
export function phraseBudget(liste, budget) {
  const { depense, reste } = bilan(liste, budget)
  return reste >= 0
    ? `Tu as dépensé ${fmtMoney(depense)} francs. Il te reste ${fmtMoney(reste)} francs.`
    : `Tu as dépensé ${fmtMoney(depense)} francs : tu dépasses ton budget de ${fmtMoney(-reste)} francs.`
}
