// Connexion à Supabase (base de données partagée).
// Sans VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, supabase = null et l'app reste 100 % sur le téléphone.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && cle
  ? createClient(url, cle, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'assime_auth', detectSessionInUrl: false } })
  : null

/** Retour d'un lien reçu par e-mail (confirmation, réinitialisation) : la session arrive dans l'adresse (#access_token=…).
 *  On l'ouvre nous-mêmes puis on nettoie l'adresse (la détection automatique bloquait le démarrage).
 *  lienRecuperation = vrai si c'est le lien « mot de passe oublié » : l'app ouvre alors « Nouveau mot de passe ». */
export const lienRecuperation = typeof window !== 'undefined' && new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'
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

// ---------- Vrais comptes : identifiant (e-mail ou téléphone) + mot de passe ----------
// Téléphone : identifiant = e-mail technique « <numéro>@tel.assime.app » (même règle que api/compte.js).
// Les codes par téléphone (inscription, oubli, changement de numéro) passent par /api/compte, côté serveur.
export const normaliserTel = tel => { const c = String(tel || '').replace(/\D/g, ''); return c.length === 8 ? '228' + c : c }
export const emailTechnique = tel => normaliserTel(tel) + '@tel.assime.app'
export const estEmailTechnique = email => /@tel\.assime\.app$/.test(email || '')
const retourSite = chemin => window.location.origin + chemin

/** Appel à /api/compte ; erreur avec un message simple (traduisible) si le serveur en donne un */
async function apiCompte(corps) {
  const r = await fetch('/api/compte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) })
  const json = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error((json.erreur || 'Erreur') + ' ' + (json.detail || '') + ' (' + r.status + ')'), { simple: r.status < 500 ? json.erreur : null, statut: r.status })
  return json
}

/** Connexion avec mot de passe. Renvoie { uid, meta } */
export async function connexionMotDePasse({ email, telephone, motDePasse }) {
  enCours = null
  const { data, error } = await supabase.auth.signInWithPassword({ email: email || emailTechnique(telephone), password: motDePasse })
  if (error) throw error
  return { uid: data.user.id, meta: data.user.user_metadata || {} }
}

/** Le compte téléphone existe-t-il, a-t-il déjà un mot de passe ? (comptes créés avant les mots de passe) */
export const etatTelephone = telephone => apiCompte({ action: 'etat', telephone })

/** Inscription par téléphone : le serveur vérifie le code et crée le compte, puis on se connecte */
export async function inscriptionTelephone({ telephone, prenom, role, code, motDePasse }) {
  await apiCompte({ action: 'inscription', telephone, prenom, role, code, motDePasse })
  return connexionMotDePasse({ telephone, motDePasse })
}

/** Inscription par e-mail : Supabase envoie le code de confirmation. Renvoie { uid } si le compte est déjà ouvert
 *  (projet sans confirmation d'e-mail), sinon {} : il faut le code. */
export async function inscriptionEmail({ email, motDePasse, prenom, role }) {
  enCours = null
  const { data, error } = await supabase.auth.signUp({ email, password: motDePasse, options: { data: { prenom, role, mdp: true }, emailRedirectTo: retourSite('/') } })
  if (error) throw error
  // Adresse déjà inscrite : Supabase ne le dit pas directement (pas d'identité créée)
  if (data.user && !data.user.identities?.length) throw Object.assign(new Error('User already registered'), { code: 'user_already_exists' })
  return data.session ? { uid: data.user.id } : {}
}
export async function renvoyerCodeInscription(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: retourSite('/') } })
  if (error) throw error
}

/** Vérifie un code reçu par e-mail. type : 'signup' (inscription), 'recovery' (mot de passe oublié), 'email_change' */
export async function verifierCodeEmail(email, token, type = 'signup') {
  enCours = null
  let r = await supabase.auth.verifyOtp({ email, token, type })
  // Selon la version de Supabase, le code d'inscription se vérifie avec le type « email »
  if (r.error && type === 'signup') r = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (r.error) throw r.error
  return { uid: r.data.user.id, meta: r.data.user.user_metadata || {} }
}

/** Mot de passe oublié par e-mail : Supabase envoie un code (et un lien) de réinitialisation */
export async function oubliEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: retourSite('/mot-de-passe/nouveau') })
  if (error) throw error
}
/** Mot de passe oublié par téléphone : code de démo vérifié par le serveur, puis connexion */
export async function oubliTelephone({ telephone, code, motDePasse }) {
  await apiCompte({ action: 'motDePasse', telephone, code, motDePasse })
  return connexionMotDePasse({ telephone, motDePasse })
}

/** Nouveau mot de passe pour le compte connecté (après un code de réinitialisation, ou depuis le profil) */
export async function changerMotDePasse(motDePasse) {
  const { data, error } = await supabase.auth.updateUser({ password: motDePasse, data: { mdp: true } })
  if (error) throw error
  return data.user
}
/** Vérifie l'ancien mot de passe avant de le changer (nouvelle connexion au même compte) */
export async function verifierMotDePasse(motDePasse) {
  const { data } = await supabase.auth.getUser()
  const email = data?.user?.email
  if (!email) throw new Error('Session expirée')
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
  if (error) throw error
}

/** Changer d'e-mail : Supabase envoie un code au NOUVEL e-mail */
export async function changerEmail(email) {
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: retourSite('/profil') })
  if (error) throw error
}
/** Changer de numéro : code de démo vérifié par le serveur (même point unique que le futur SMS) */
export async function changerTelephone(telephone, code) {
  const { data } = await supabase.auth.getSession()
  const jeton = data.session?.access_token
  if (!jeton) throw new Error('Session expirée')
  const r = await apiCompte({ action: 'telephone', jeton, telephone, code })
  await supabase.auth.refreshSession().catch(() => {}) // l'identifiant d'un compte téléphone a changé
  return r.telephone
}

/** Prénom et rôle d'un compte qui vient de se connecter */
export async function profilDe(uid) {
  const { data } = await supabase.from('profils').select('prenom, telephone, role').eq('id', uid).maybeSingle()
  return data
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

/** Supprime ma boutique (la règle de la base n'autorise que son propriétaire) et toutes mes photos (photos/<uid>/) */
export async function supprimerBoutique(id, uid) {
  const { data, error } = await supabase.from('boutiques').delete().eq('id', id).eq('proprietaire', uid).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Boutique introuvable ou pas à toi')
  const { data: fichiers, error: e2 } = await supabase.storage.from('photos').list(uid, { limit: 1000 })
  if (e2) throw e2
  if (fichiers?.length) {
    const { error: e3 } = await supabase.storage.from('photos').remove(fichiers.map(f => uid + '/' + f.name))
    if (e3) throw e3
  }
}

// ---------- Coups de cœur ----------
export async function chargerCoeurs() {
  // Sans session (visiteur sans compte), « mes_coeurs » et « mes votes » sont interdits (401) : on ne les demande pas
  const { data: s } = await supabase.auth.getSession()
  const vide = { data: [] }
  const [pub, miens, votes] = await Promise.all([
    supabase.rpc('coeurs_publics'),
    s.session ? supabase.rpc('mes_coeurs') : vide,
    s.session ? supabase.from('coups_de_coeur').select('boutique_id, sens') : vide,
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
