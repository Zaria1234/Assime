// Génère supabase/seed.sql à partir des boutiques de démonstration (src/data/demo.js).
// Usage : node scripts/generer-seed.mjs
import { writeFile } from 'node:fs/promises'
import { BOUTIQUES_DEMO, COEURS_DEMO } from '../src/data/demo.js'

const q = v => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const lignes = BOUTIQUES_DEMO.map(b => {
  const c = COEURS_DEMO[b.id] || { plus: 0, moins: 0 }
  const articles = JSON.stringify((b.articles || []).map((a, i) => ({ id: `${b.id}-a${i}`, nom: a.nom, prix: a.prix ?? null, stock: a.stock !== false })))
  return `(${q(b.id)}, ${q(b.nom)}, ${q(b.categorie)}, ${!!b.gros}, ${b.pos[0]}, ${b.pos[1]}, ${q(b.zone)}, ${q(b.repere)}, ${q(b.horaires)}, ${!!b.verifiee}, ${Math.max(0, c.plus - c.moins)}, ${q(articles)}::jsonb)`
})
const sql = `-- Boutiques de démonstration (positions APPROXIMATIVES, à corriger sur le terrain).
-- À lancer après schema.sql, dans Supabase → SQL Editor. Relançable sans doublon.
insert into public.boutiques (id, nom, categorie, gros, lat, lng, zone, repere, horaires, verifiee, coeurs_depart, articles) values
${lignes.join(',\n')}
on conflict (id) do update set nom = excluded.nom, categorie = excluded.categorie, gros = excluded.gros, lat = excluded.lat, lng = excluded.lng,
  zone = excluded.zone, repere = excluded.repere, horaires = excluded.horaires, verifiee = excluded.verifiee,
  coeurs_depart = excluded.coeurs_depart, articles = excluded.articles;
`
await writeFile(new URL('../supabase/seed.sql', import.meta.url), sql)
console.log('✓ supabase/seed.sql :', BOUTIQUES_DEMO.length, 'boutiques')
