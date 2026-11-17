// Outils géographiques — sans dépendance, pour garder l'app légère

// Centre du Grand Marché de Lomé (coordonnées Wikipedia)
export const MARCHE = [6.1256261, 1.2254183]

const R = 6371000
const toRad = d => (d * Math.PI) / 180
const toDeg = r => (r * 180) / Math.PI

/** Distance en mètres entre deux points [lat, lng] */
export function distance(a, b) {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Cap en degrés (0 = nord) de a vers b */
export function bearing(a, b) {
  const y = Math.sin(toRad(b[1] - a[1])) * Math.cos(toRad(b[0]))
  const x = Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) - Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(toRad(b[1] - a[1]))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

const DIRS = ['le nord', 'le nord-est', "l'est", 'le sud-est', 'le sud', 'le sud-ouest', "l'ouest", 'le nord-ouest']
export const directionIndex = deg => Math.round(deg / 45) % 8 // 0 = nord … 7 = nord-ouest (l'app traduit dir.0 … dir.7)
export const directionName = deg => DIRS[directionIndex(deg)]

export const fmtDist = m => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`)
export const fmtMoney = n => Number(n || 0).toLocaleString('fr-FR')

export function pathLength(pts) {
  let s = 0
  for (let i = 1; i < pts.length; i++) s += distance(pts[i - 1], pts[i])
  return s
}

/**
 * Coupe les boucles d'un trajet : si on repasse à moins de `radius` mètres
 * d'un point déjà visité, le détour entre les deux est supprimé.
 */
export function cutLoops(pts, radius = 8) {
  const out = []
  for (const p of pts) {
    let j = -1
    for (let k = 0; k < out.length - 3; k++) {
      if (distance(out[k], p) < radius) { j = k; break }
    }
    if (j >= 0) out.length = j + 1
    out.push(p)
  }
  return out
}

/** Décale un point de n mètres vers le nord et e mètres vers l'est */
export function offset([lat, lng], n, e) {
  return [lat + n / 111320, lng + e / (111320 * Math.cos(toRad(lat)))]
}

/** Point GPS acceptable ? (précision suffisante et assez loin du précédent) */
export function keepPoint(prev, p, accuracy, { maxAccuracy = 25, minStep = 3 } = {}) {
  if (accuracy > maxAccuracy) return false
  if (prev && distance(prev, p) < minStep) return false
  return true
}
