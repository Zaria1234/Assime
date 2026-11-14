// Connexion à Supabase (base de données partagée).
// Sans VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, supabase = null et l'app reste 100 % sur le téléphone.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && cle
  ? createClient(url, cle, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'assime_auth', detectSessionInUrl: false } })
  : null

/** Retour du lien « Log In » de l'e-mail : la session arrive dans l'adresse (#access_token=…).
 *  On l'ouvre nous-mêmes puis on nettoie l'adresse (la détection automatique bloquait le démarrage). */
const sessionDuLien = (() => {
  if (!supabase || typeof window === 'undefined') return Promise.resolve()
  const p = new URLSearchParams(window.location.hash.slice(1))
  const access_token = p.get('access_token'), refresh_token = p.get('refresh_token')
  if (!access_token || !refresh_token) return Promise.resolve()
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return supabase.auth.setSession({ access_token, refresh_token }).catch(() => { /* lien expiré : on reste déconnecté */ })
})()

/** Session déjà ouverte sur ce téléphone (vrai compte ou anonyme), sans en créer : { uid, anonyme } ou null */
export async function sessionActuelle() {
  if (!supabase) return null
  await sessionDuLien
  const { data } = await supabase.auth.getSession()
  const u = data.session?.user
  return u ? { uid: u.id, anonyme: !!u.is_anonymous } : null
}

/** Identité pour « Continuer sans compte » (et un vote sans compte) : compte anonyme créé la première fois.
 *  Une seule demande à la fois, même si l'app la réclame deux fois. */
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

// ---------- Vrais comptes : téléphone (code de démo, via /api/compte) ou e-mail (Supabase) ----------
/** Téléphone : le serveur crée ou retrouve le compte, puis on échange son jeton contre une vraie session.
 *  Renvoie { uid, profil: { prenom, telephone, role }, nouveau } */
export async function connexionTelephone({ telephone, prenom, role, code }) {
  const r = await fetch('/api/compte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telephone, prenom, role, code }) })
  const json = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(json.erreur || 'Connexion impossible (' + r.status + ')')
  enCours = null
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: json.token_hash, type: 'magiclink' })
  if (error) throw error
  return { uid: data.user.id, profil: json.profil, nouveau: json.nouveau }
}

/** E-mail : Supabase envoie un message avec un lien de connexion (et le code à 6 chiffres si le modèle l'affiche) */
export async function envoyerCodeEmail(email, { prenom = '', role = 'acheteur' } = {}) {
  const { error } = await supabase.auth.signInWithOtp({
    email, options: { shouldCreateUser: true, data: { prenom, role }, emailRedirectTo: window.location.origin + '/' },
  })
  if (error) throw error
}
export async function verifierCodeEmail(email, token) {
  enCours = null
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
  return { uid: data.user.id, meta: data.user.user_metadata || {} }
}

export async function deconnecter() {
  enCours = null
  if (supabase) await supabase.auth.signOut().catch(() => {})
}

/** Ce qui suit le compte : profil (prénom, rôle, favoris), listes de marché et boutique du vendeur */
export async function chargerCompte(uid) {
  const [p, l, b] = await Promise.all([
    supabase.from('profils').select('prenom, telephone, role, favoris').eq('id', uid).maybeSingle(),
    supabase.from('listes').select('id, nom, budget, items').order('cree_le'),
    supabase.from('boutiques').select('id').eq('proprietaire', uid).order('cree_le').limit(1),
  ])
  if (p.error) throw p.error
  if (l.error) throw l.error
  const { data: u } = await supabase.auth.getUser()
  return { profil: p.data, listes: l.data || [], boutique: b.data?.[0]?.id || null, email: u?.user?.email || '', meta: u?.user?.user_metadata || {} }
}

/** Envoie toutes mes listes (et supprime celles que j'ai effacées) */
export async function enregistrerListes(listes, uid) {
  const lignes = listes.map(l => ({ id: l.id, auteur: uid, nom: (l.nom || 'Ma liste').slice(0, 80), budget: Math.max(0, Math.round(Number(l.budget) || 0)), items: l.items || [] }))
  const { error } = await supabase.from('listes').upsert(lignes, { onConflict: 'auteur,id' })
  if (error) throw error
  const ids = lignes.map(l => l.id)
  let q = supabase.from('listes').delete().eq('auteur', uid)
  if (ids.length) q = q.not('id', 'in', '(' + ids.map(i => '"' + i + '"').join(',') + ')')
  const { error: e2 } = await q
  if (e2) throw e2
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
export async function enregistrerProfil(user, uid, favoris = []) {
  if (!user) return
  const { error } = await supabase.from('profils').upsert({ id: uid, prenom: user.prenom || '', telephone: user.tel || '', role: user.role || 'acheteur', favoris })
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
