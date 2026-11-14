// Connexion à Supabase (base de données partagée).
// Sans VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, supabase = null et l'app reste 100 % sur le téléphone.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && cle
  ? createClient(url, cle, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'assime_auth' } })
  : null

/** Identité du téléphone : on crée un compte anonyme la première fois (aucun SMS nécessaire).
 *  Une seule demande à la fois, même si l'app la réclame deux fois au démarrage. */
let enCours = null
export function identite() {
  if (!supabase) return Promise.resolve(null)
  if (!enCours) {
    enCours = (async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) return data.session.user.id
      const { data: d, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      return d.user.id
    })().catch(e => { enCours = null; throw e })
  }
  return enCours
}

// ---------- Conversion boutique app ⇄ ligne de la base ----------
export const versLigne = b => ({
  id: b.id, nom: b.nom, categorie: b.categorie, gros: !!b.gros, lat: b.pos[0], lng: b.pos[1],
  zone: b.zone || '', repere: b.repere || '', horaires: b.horaires || '', telephone: b.telephone || '', whatsapp: b.whatsapp || '',
  couverture: b.couverture || null, photo: b.photo || null, articles: b.articles || [],
})
export const depuisLigne = l => ({
  id: l.id, nom: l.nom, categorie: l.categorie, gros: l.gros, pos: [l.lat, l.lng], zone: l.zone, repere: l.repere, horaires: l.horaires,
  telephone: l.telephone, whatsapp: l.whatsapp, couverture: l.couverture, photo: l.photo, articles: l.articles || [],
  verifiee: l.verifiee, proprietaire: l.proprietaire,
})

// ---------- Photos : les images « data: » du téléphone partent dans Supabase Storage ----------
async function envoyerPhoto(dataUrl, uid) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl // déjà une URL
  const blob = await (await fetch(dataUrl)).blob()
  const chemin = `${uid}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('photos').upload(chemin, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from('photos').getPublicUrl(chemin).data.publicUrl
}

export async function chargerBoutiques() {
  const { data, error } = await supabase.from('boutiques').select('*').order('cree_le')
  if (error) throw error
  return data.map(depuisLigne)
}

/** Enregistre (crée ou met à jour) une boutique ; envoie d'abord ses photos. Renvoie la boutique telle qu'enregistrée. */
export async function enregistrerBoutique(b, uid) {
  const prete = {
    ...b,
    couverture: await envoyerPhoto(b.couverture, uid),
    photo: await envoyerPhoto(b.photo, uid),
    articles: await Promise.all((b.articles || []).map(async a => ({ ...a, image: await envoyerPhoto(a.image, uid) }))),
  }
  const { data, error } = await supabase.from('boutiques').upsert(versLigne(prete)).select().single()
  if (error) throw error
  return depuisLigne(data)
}

// ---------- Coups de cœur ----------
export async function chargerCoeurs() {
  const [pub, miens, votes] = await Promise.all([
    supabase.rpc('coeurs_publics'),
    supabase.rpc('mes_coeurs'),
    supabase.from('coups_de_coeur').select('boutique_id, sens'),
  ])
  if (pub.error) throw pub.error
  return {
    publics: Object.fromEntries((pub.data || []).map(r => [r.boutique_id, r.affiches])),
    vendeur: Object.fromEntries((miens.data || []).map(r => [r.boutique_id, { plus: r.plus, moins: r.moins }])),
    votes: Object.fromEntries((votes.data || []).map(r => [r.boutique_id, r.sens])),
  }
}

export async function envoyerVote(boutiqueId, sens, uid) {
  const q = sens
    ? supabase.from('coups_de_coeur').upsert({ boutique_id: boutiqueId, auteur: uid, sens }, { onConflict: 'boutique_id,auteur' })
    : supabase.from('coups_de_coeur').delete().eq('boutique_id', boutiqueId).eq('auteur', uid)
  const { error } = await q
  if (error) throw error
}

// ---------- Profil et relevés ----------
export async function enregistrerProfil(user, uid) {
  if (!user) return
  const { error } = await supabase.from('profils').upsert({ id: uid, prenom: user.prenom || '', telephone: user.tel || '', role: user.role || 'acheteur' })
  if (error) throw error
}

export async function envoyerReleve(points, marques = [], longueur = null) {
  const { error } = await supabase.from('releves').insert({ points, marques, longueur_m: longueur })
  if (error) throw error
}

/** Temps réel : appelle quandChange() dès qu'une boutique ou un vote change ailleurs */
export function abonner(quandChange) {
  const canal = supabase.channel('assime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'boutiques' }, quandChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'coups_de_coeur' }, quandChange)
    .subscribe()
  return () => supabase.removeChannel(canal)
}
