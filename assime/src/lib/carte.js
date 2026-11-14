// Recherche de lieux sur la carte (OpenStreetMap / Nominatim), limitée à Lomé.
// Gratuit, sans clé. Règles d'usage : 1 requête par seconde au maximum,
// donc on ne cherche qu'à la validation (pas à chaque lettre).
const LOME = '1.15,6.22,1.32,6.10' // ouest, nord, est, sud

export async function chercherSurCarte(texte) {
  const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
    q: texte, format: 'jsonv2', limit: '8', viewbox: LOME, bounded: '1', 'accept-language': 'fr', countrycodes: 'tg',
  })
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('Recherche indisponible')
  const data = await r.json()
  return data.map(d => ({
    id: d.place_id,
    nom: d.name || d.display_name.split(',')[0],
    adresse: d.display_name.split(',').slice(1, 3).join(',').trim(),
    type: d.type,
    pos: [Number(d.lat), Number(d.lon)],
  }))
}
