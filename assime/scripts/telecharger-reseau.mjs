// npm run carte — télécharge les rues OpenStreetMap autour du Grand Marché
// et les enregistre dans public/data/reseau-marche.json (intégré à l'app, marche hors ligne).
// À relancer quand OpenStreetMap est mis à jour, ou après avoir ajouté des allées.
import { writeFile, mkdir } from 'node:fs/promises'

const MARCHE = [6.1256261, 1.2254183]
const R = 0.008
const [s, o, n, e] = [MARCHE[0] - R, MARCHE[1] - R, MARCHE[0] + R, MARCHE[1] + R]
const requete = `[out:json][timeout:25];way["highway"](${s},${o},${n},${e});(._;>;);out skel qt;`
const EXCLUS = new Set(['motorway', 'motorway_link', 'construction', 'proposed', 'raceway', 'bus_guideway'])

for (const serveur of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
  try {
    console.log('Téléchargement depuis', serveur, '…')
    const r = await fetch(serveur, { method: 'POST', body: 'data=' + encodeURIComponent(requete), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Assime/1.3' } })
    if (!r.ok) { console.log('  réponse', r.status); continue }
    const data = await r.json()
    const noeuds = {}, voies = []
    for (const el of data.elements) if (el.type === 'node') noeuds[el.id] = [Number(el.lat.toFixed(7)), Number(el.lon.toFixed(7))]
    for (const el of data.elements) if (el.type === 'way' && el.nodes?.length > 1 && !EXCLUS.has(el.tags?.highway)) voies.push(el.nodes)
    await mkdir('public/data', { recursive: true })
    await writeFile('public/data/reseau-marche.json', JSON.stringify({ source: 'OpenStreetMap', licence: 'ODbL © contributeurs OpenStreetMap', date: Date.now(), noeuds, voies }))
    console.log(`✓ ${voies.length} voies et ${Object.keys(noeuds).length} points enregistrés dans public/data/reseau-marche.json`)
    process.exit(0)
  } catch (err) {
    console.log('  échec :', err.message)
  }
}
console.error('✗ Impossible de joindre OpenStreetMap. Vérifie la connexion internet.')
process.exit(1)
