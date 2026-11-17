// Fonction serveur Vercel : POST /api/compte — comptes par numéro de téléphone.
// Un compte téléphone est un vrai compte Supabase dont l'identifiant est l'e-mail technique « <numéro>@tel.assime.app »
// (jamais affiché, jamais utilisé pour écrire). L'app s'y connecte avec signInWithPassword.
// SUPABASE_SERVICE_ROLE_KEY reste sur le serveur : jamais de préfixe VITE_, jamais dans le navigateur.
//
// Actions (champ « action » du corps) :
//   inscription  { telephone, prenom, role, code, motDePasse } → crée le compte (code SMS vérifié)
//   motDePasse   { telephone, code, motDePasse }               → nouveau mot de passe (oublié, ou ancien compte sans mot de passe)
//   etat         { telephone }                                 → { existe, motDePasse } : le compte existe-t-il, a-t-il un mot de passe ?
//   telephone    { jeton, telephone, code }                    → change le numéro du compte connecté (jeton = session)
import { createClient } from '@supabase/supabase-js'

/** LE SEUL ENDROIT où vérifier un code reçu par SMS (inscription, mot de passe oublié, changement de numéro).
 *  Démo : n'importe quel code à 6 chiffres est accepté.
 *  Plus tard : appeler ici le fournisseur SMS (Twilio Verify, Orange SMS API…) et renvoyer false si le code est faux.
 *  Tant que c'est la démo, un compte téléphone n'est protégé que par son mot de passe… et ce code (voir docs/BACKEND.md). */
async function codeSmsValide(telephone, code) {
  return /^\d{6}$/.test(code)
}

/** « 90 00 00 00 » ou « +228 90000000 » → « 22890000000 » (même règle que src/lib/supabase.js) */
export function normaliser(tel) {
  const chiffres = String(tel || '').replace(/\D/g, '')
  return chiffres.length === 8 ? '228' + chiffres : chiffres
}
export const emailTechnique = telephone => `${normaliser(telephone)}@tel.assime.app`

const MOT_DE_PASSE_MIN = 8
const err = (statut, erreur, extra = {}) => ({ statut, json: { erreur, ...extra } })

/** Le compte téléphone de ce numéro : uniquement un compte dont l'identifiant EST ce numéro
 *  (un compte e-mail qui a juste noté ce numéro comme contact n'est jamais concerné) */
async function compteDuNumero(admin, telephone) {
  const email = emailTechnique(telephone)
  const { data: lignes } = await admin.from('profils').select('id').eq('telephone', normaliser(telephone)).limit(20)
  for (const l of lignes || []) {
    const { data } = await admin.auth.admin.getUserById(l.id)
    if (data?.user?.email === email) return data.user
  }
  return null
}

/** Cœur de la fonction, indépendant de Vercel (réutilisé en local par Vite) */
export async function traiterCompte(corps, env = process.env) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const cleServeur = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !cleServeur) return err(503, 'Comptes indisponibles sur le serveur')

  const action = String(corps?.action || '')
  const telephone = normaliser(corps?.telephone)
  if (telephone.length < 8 || telephone.length > 15) return err(400, 'Numéro invalide')
  const admin = createClient(url, cleServeur, { auth: { persistSession: false, autoRefreshToken: false } })
  const code = String(corps?.code || '')
  const motDePasse = String(corps?.motDePasse || '')

  // --- Le compte existe-t-il ? A-t-il déjà un mot de passe ? (pour les comptes créés avant les mots de passe)
  if (action === 'etat') {
    const u = await compteDuNumero(admin, telephone)
    return { statut: 200, json: { existe: !!u, motDePasse: !!u?.user_metadata?.mdp } }
  }

  if (!(await codeSmsValide(telephone, code))) return err(401, 'Code incorrect')

  // --- Inscription : prénom, rôle, mot de passe
  if (action === 'inscription') {
    const prenom = String(corps?.prenom || '').trim().slice(0, 60)
    const role = corps?.role === 'vendeur' ? 'vendeur' : 'acheteur'
    if (!prenom) return err(400, 'Prénom manquant')
    if (motDePasse.length < MOT_DE_PASSE_MIN) return err(400, 'Mot de passe trop court')
    const { data, error } = await admin.auth.admin.createUser({
      email: emailTechnique(telephone), password: motDePasse, email_confirm: true,
      user_metadata: { prenom, telephone, role, mdp: true },
    })
    if (error) {
      if (error.code === 'email_exists' || /already/i.test(error.message)) return err(409, 'Ce numéro a déjà un compte. Connecte-toi.')
      if (error.code === 'weak_password') return err(400, 'Mot de passe trop faible')
      return err(500, 'Compte non créé', { detail: error.message })
    }
    const { error: e2 } = await admin.from('profils').upsert({ id: data.user.id, prenom, telephone, role })
    if (e2) return err(500, 'Profil non enregistré', { detail: e2.message })
    return { statut: 200, json: { ok: true } }
  }

  // --- Nouveau mot de passe : oublié, ou ancien compte qui n'en avait pas encore
  if (action === 'motDePasse') {
    if (motDePasse.length < MOT_DE_PASSE_MIN) return err(400, 'Mot de passe trop court')
    const u = await compteDuNumero(admin, telephone)
    if (!u) return err(404, 'Aucun compte avec ce numéro. Crée ton compte.')
    const { error } = await admin.auth.admin.updateUserById(u.id, { password: motDePasse, user_metadata: { ...(u.user_metadata || {}), mdp: true } })
    if (error) return err(error.code === 'weak_password' ? 400 : 500, error.code === 'weak_password' ? 'Mot de passe trop faible' : 'Mot de passe non changé', { detail: error.message })
    return { statut: 200, json: { ok: true } }
  }

  // --- Changer le numéro du compte connecté
  if (action === 'telephone') {
    const { data: moi, error } = await admin.auth.getUser(String(corps?.jeton || ''))
    if (error || !moi?.user || moi.user.is_anonymous) return err(401, 'Session expirée, reconnecte-toi')
    const u = moi.user
    const compteTel = /@tel\.assime\.app$/.test(u.email || '')
    if (compteTel) {
      // L'identifiant de connexion change avec le numéro : il ne doit pas déjà servir à un autre compte
      if (await compteDuNumero(admin, telephone)) return err(409, 'Ce numéro a déjà un compte.')
      const { error: e1 } = await admin.auth.admin.updateUserById(u.id, { email: emailTechnique(telephone), email_confirm: true, user_metadata: { ...(u.user_metadata || {}), telephone } })
      if (e1) return err(500, 'Numéro non changé', { detail: e1.message })
    }
    const { error: e2 } = await admin.from('profils').update({ telephone }).eq('id', u.id)
    if (e2) return err(500, 'Numéro non changé', { detail: e2.message })
    return { statut: 200, json: { ok: true, telephone } }
  }

  return err(400, 'Action inconnue')
}

/** Point d'entrée Vercel */
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ erreur: 'POST uniquement' }) }
  try {
    const corps = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const { statut, json } = await traiterCompte(corps)
    res.status(statut).json(json)
  } catch (e) {
    res.status(500).json({ erreur: 'Erreur interne', detail: String(e?.message || e).slice(0, 200) })
  }
}
