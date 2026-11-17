// Horaires d'une boutique : enregistrés en texte français lisible (« Lun–Sam · 7h–18h »),
// relus pour le formulaire et réaffichés dans la langue choisie. Un texte libre reste tel quel.
const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const TOUS_FR = 'Tous les jours'

/** Propositions en un toucher (jours : 0 = lundi … 6 = dimanche ; heures « H:MM ») */
export const PROPOSITIONS = [
  { jours: [0, 1, 2, 3, 4, 5], de: '7:00', a: '18:00' },
  { jours: [0, 1, 2, 3, 4, 5, 6], de: '7:00', a: '19:00' },
  { jours: [0, 1, 2, 3, 4], de: '8:00', a: '17:00' },
]

/** Heures proposées dans les sélecteurs : de 5 h à 23 h, toutes les demi-heures */
export const HEURES = Array.from({ length: 37 }, (_, i) => `${5 + Math.floor(i / 2)}:${i % 2 ? '30' : '00'}`)

const heureFr = h => { const [H, M] = h.split(':'); return `${Number(H)}h${M === '00' ? '' : M}` }
const heureEn = h => { const [H, M] = h.split(':'); return `${Number(H)}:${M}` }
/** Une heure « H:MM » affichée dans la langue choisie (sélecteurs du formulaire) */
export const heureLisible = (h, langue) => (langue === 'en' ? heureEn(h) : heureFr(h))

function joursTexte(jours, noms, tous) {
  const j = [...new Set(jours)].sort((a, b) => a - b)
  if (j.length === 7) return tous
  const suivis = j.every((x, i) => i === 0 || x === j[i - 1] + 1)
  if (suivis && j.length >= 2) return `${noms[j[0]]}–${noms[j[j.length - 1]]}`
  return j.map(x => noms[x]).join(', ')
}

/** { jours, de, a } → texte enregistré (français) ou affiché (noms et format donnés) */
export function texteHoraires({ jours, de, a }, noms = JOURS_FR, tous = TOUS_FR, heure = heureFr) {
  if (!jours?.length) return ''
  return `${joursTexte(jours, noms, tous)} · ${heure(de)}–${heure(a)}`
}

/** Texte enregistré → { jours, de, a }, ou null si c'est un texte libre */
export function lireHoraires(texte) {
  const m = /^(.+) · (\d{1,2})h(\d{2})?–(\d{1,2})h(\d{2})?$/.exec(String(texte || '').trim())
  if (!m) return null
  const de = `${Number(m[2])}:${m[3] || '00'}`, a = `${Number(m[4])}:${m[5] || '00'}`
  const partie = m[1]
  let jours
  if (partie === TOUS_FR) jours = [0, 1, 2, 3, 4, 5, 6]
  else if (/^\w{3}–\w{3}$/.test(partie)) {
    const [x, y] = partie.split('–').map(n => JOURS_FR.indexOf(n))
    if (x < 0 || y < x) return null
    jours = Array.from({ length: y - x + 1 }, (_, i) => x + i)
  } else {
    jours = partie.split(', ').map(n => JOURS_FR.indexOf(n))
    if (jours.some(x => x < 0)) return null
  }
  return { jours, de, a }
}

/** Horaires à afficher dans la langue choisie (t = fonction de traduction de l'app) */
export function horairesLisibles(texte, langue, t) {
  const h = langue === 'fr' ? null : lireHoraires(texte)
  if (!h) return texte
  return texteHoraires(h, JOURS_FR.map((_, i) => t('jour.' + i)), t('hor.tous'), langue === 'en' ? heureEn : heureFr)
}
