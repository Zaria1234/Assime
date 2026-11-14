// Itinéraire à pied par les vraies rues, avec les données OpenStreetMap autour du Grand Marché.
// 1. Charge le réseau des rues : fichier intégré (public/data/reseau-marche.json) → cache du téléphone → téléchargement OSM.
// 2. Calcule le plus court chemin (A*) sur ce réseau, dans le téléphone, en quelques millisecondes.
// 3. Si on est loin de toute rue (ex. au fond d'une allée non cartographiée), le premier et le dernier bout sont à vol d'oiseau.
// Sans réseau du tout, la fonction renvoie null et l'app garde la ligne droite.
import { distance, bearing, MARCHE } from './geo'

const CLE_CACHE = 'assime_reseau_osm_v1'
const DUREE_CACHE = 7 * 24 * 3600 * 1000 // une semaine
const RAYON = 0.008 // environ 900 m autour du marché
export const ZONE = [MARCHE[0] - RAYON, MARCHE[1] - RAYON, MARCHE[0] + RAYON, MARCHE[1] + RAYON] // sud, ouest, nord, est
const EXCLUS = new Set(['motorway', 'motorway_link', 'construction', 'proposed', 'raceway', 'bus_guideway'])
const ACCROCHE_MAX = 150 // au-delà de 150 m de toute rue, on ne tente pas l'itinéraire

/** Requête Overpass (OpenStreetMap) : toutes les voies où l'on peut marcher dans la zone */
export const requeteOverpass = ([s, o, n, e] = ZONE) =>
  `[out:json][timeout:25];way["highway"](${s},${o},${n},${e});(._;>;);out skel qt;`

/** Transforme la réponse Overpass en réseau compact { noeuds: {id: [lat,lng]}, voies: [[id, id, …]] } */
export function depuisOverpass(data) {
  const noeuds = {}, voies = []
  for (const el of data?.elements || []) {
    if (el.type === 'node') noeuds[el.id] = [el.lat, el.lon]
  }
  for (const el of data?.elements || []) {
    if (el.type === 'way' && el.nodes?.length > 1 && !EXCLUS.has(el.tags?.highway)) voies.push(el.nodes)
  }
  return { noeuds, voies, source: 'OpenStreetMap', date: Date.now() }
}

/** Construit le graphe : pour chaque nœud, ses voisins et la distance en mètres */
export function construireGraphe(reseau) {
  const voisins = new Map()
  const lier = (a, b) => {
    const pa = reseau.noeuds[a], pb = reseau.noeuds[b]
    if (!pa || !pb) return
    const d = distance(pa, pb)
    if (!voisins.has(a)) voisins.set(a, [])
    if (!voisins.has(b)) voisins.set(b, [])
    voisins.get(a).push([b, d]); voisins.get(b).push([a, d])
  }
  for (const v of reseau.voies) for (let i = 1; i < v.length; i++) lier(String(v[i - 1]), String(v[i]))
  const noeuds = {}
  for (const id of voisins.keys()) noeuds[id] = reseau.noeuds[id]
  return { noeuds, voisins }
}

/** Nœud du réseau le plus proche d'un point */
function plusProche(graphe, p) {
  let meilleur = null, dmin = Infinity
  for (const [id, pos] of Object.entries(graphe.noeuds)) {
    const d = distance(p, pos)
    if (d < dmin) { dmin = d; meilleur = id }
  }
  return { id: meilleur, d: dmin }
}

/** File de priorité minimale (tas binaire) pour A* */
class Tas {
  constructor() { this.t = [] }
  get taille() { return this.t.length }
  ajouter(cle, prio) {
    const t = this.t; t.push([prio, cle]); let i = t.length - 1
    while (i > 0) { const p = (i - 1) >> 1; if (t[p][0] <= t[i][0]) break;[t[p], t[i]] = [t[i], t[p]]; i = p }
  }
  retirer() {
    const t = this.t, haut = t[0], bas = t.pop()
    if (t.length) {
      t[0] = bas; let i = 0
      for (;;) {
        const g = 2 * i + 1, d = g + 1; let m = i
        if (g < t.length && t[g][0] < t[m][0]) m = g
        if (d < t.length && t[d][0] < t[m][0]) m = d
        if (m === i) break;[t[m], t[i]] = [t[i], t[m]]; i = m
      }
    }
    return haut[1]
  }
}

/**
 * Plus court chemin à pied entre deux points.
 * Renvoie { points, distance, parRues, volOiseau } ou null si impossible (réseau absent ou trop loin).
 */
export function plusCourtChemin(graphe, depart, arrivee) {
  if (!graphe || !depart || !arrivee) return null
  const a = plusProche(graphe, depart), b = plusProche(graphe, arrivee)
  if (!a.id || !b.id || a.d > ACCROCHE_MAX || b.d > ACCROCHE_MAX) return null
  const direct = distance(depart, arrivee)
  if (a.id === b.id || direct < 25) return { points: [depart, arrivee], distance: direct, parRues: 0, volOiseau: direct }

  const cible = graphe.noeuds[b.id]
  const g = new Map([[a.id, 0]]), venant = new Map(), fait = new Set(), tas = new Tas()
  tas.ajouter(a.id, distance(graphe.noeuds[a.id], cible))
  while (tas.taille) {
    const u = tas.retirer()
    if (u === b.id) break
    if (fait.has(u)) continue
    fait.add(u)
    for (const [v, d] of graphe.voisins.get(u) || []) {
      const ng = g.get(u) + d
      if (ng < (g.get(v) ?? Infinity)) { g.set(v, ng); venant.set(v, u); tas.ajouter(v, ng + distance(graphe.noeuds[v], cible)) }
    }
  }
  if (!g.has(b.id)) return null // les deux points ne sont pas reliés

  const chemin = [b.id]
  while (chemin[0] !== a.id) chemin.unshift(venant.get(chemin[0]))
  const parRues = g.get(b.id)
  const total = a.d + parRues + b.d
  // Si le détour par les rues est absurde (plus de 3 fois la ligne droite), on garde la ligne droite
  if (total > direct * 3 + 100) return { points: [depart, arrivee], distance: direct, parRues: 0, volOiseau: direct }
  return { points: [depart, ...chemin.map(id => graphe.noeuds[id]), arrivee], distance: total, parRues, volOiseau: a.d + b.d }
}

/** Prochaine consigne : « Tout droit 40 m, puis à gauche » */
export function prochaineConsigne(points) {
  if (!points || points.length < 3) return null
  let parcouru = distance(points[0], points[1])
  for (let i = 1; i < points.length - 1; i++) {
    const avant = bearing(points[i - 1], points[i]), apres = bearing(points[i], points[i + 1])
    const angle = ((apres - avant + 540) % 360) - 180
    // les premiers mètres (rejoindre la rue) ne comptent pas comme un virage
    if (Math.abs(angle) > 35 && parcouru >= 15) return { distance: parcouru, cote: angle > 0 ? 'droite' : 'gauche' }
    parcouru += distance(points[i], points[i + 1])
  }
  return null
}

// ---- Chargement du réseau (une seule fois par session) ----
let promesse = null

function lireCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CLE_CACHE) || 'null')
    return c && Date.now() - c.date < DUREE_CACHE ? c : null
  } catch { return null }
}

async function telecharger() {
  // 1. Fichier intégré à l'app (généré avec « npm run carte »), marche hors ligne
  try {
    const r = await fetch(import.meta.env.BASE_URL + 'data/reseau-marche.json', { cache: 'force-cache' })
    if (r.ok) { const d = await r.json(); if (d?.voies?.length) return d }
  } catch { /* pas de fichier intégré */ }
  // 2. Cache du téléphone
  const c = lireCache()
  if (c) return c
  // 3. Téléchargement OpenStreetMap (serveur Overpass)
  for (const serveur of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try {
      const r = await fetch(serveur, { method: 'POST', body: 'data=' + encodeURIComponent(requeteOverpass()), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      if (!r.ok) continue
      const reseau = depuisOverpass(await r.json())
      if (reseau.voies.length) {
        try { localStorage.setItem(CLE_CACHE, JSON.stringify(reseau)) } catch { /* stockage plein */ }
        return reseau
      }
    } catch { /* serveur suivant */ }
  }
  return null
}

/** Renvoie le graphe des rues (ou null), en le chargeant une seule fois */
export function chargerGraphe() {
  if (!promesse) promesse = telecharger().then(r => (r ? { ...construireGraphe(r), source: r.source || 'OpenStreetMap', nbVoies: r.voies.length } : null)).catch(() => null)
  return promesse
}
