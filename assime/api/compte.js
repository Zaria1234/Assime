// Fonction serveur Vercel : POST /api/compte — connexion par numéro de téléphone.
// Crée (ou retrouve) un VRAI compte Supabase lié au numéro, puis renvoie un jeton à usage unique
// que l'app échange contre une session (supabase.auth.verifyOtp).
// SUPABASE_SERVICE_ROLE_KEY reste sur le serveur : jamais de préfixe VITE_, jamais dans le navigateur.
import { createClient } from '@supabase/supabase-js'

/** Le seul endroit où vérifier le code reçu par SMS.
 *  Démo : n'importe quel code à 6 chiffres est accepté.
 *  Plus tard : appeler ici le fournisseur SMS (Twilio Verify, Orange SMS API…) et renvoyer false si le code est faux. */
async function codeSmsValide(telephone, code) {
  return /^\d{6}$/.test(code)
}

/** « 90 00 00 00 » ou « +228 90000000 » → « 22890000000 » */
function normaliser(tel) {
  const chiffres = String(tel || '').replace(/\D/g, '')
  return chiffres.length === 8 ? '228' + chiffres : chiffres
}

/** Cœur de la fonction, indépendant de Vercel (réutilisé en local par Vite) */
export async function traiterCompte(corps, env = process.env) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const cleServeur = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !cleServeur) return { statut: 503, json: { erreur: 'Comptes indisponibles sur le serveur' } }

  const telephone = normaliser(corps?.telephone)
  const code = String(corps?.code || '')
  if (telephone.length < 8 || telephone.length > 15) return { statut: 400, json: { erreur: 'Numéro invalide' } }
  if (!(await codeSmsValide(telephone, code))) return { statut: 401, json: { erreur: 'Code incorrect' } }

  const admin = createClient(url, cleServeur, { auth: { persistSession: false, autoRefreshToken: false } })
  const email = `${telephone}@tel.assime.app` // e-mail technique, jamais affiché ni utilisé pour écrire
  const prenom = String(corps?.prenom || '').trim().slice(0, 60)
  const role = corps?.role === 'vendeur' ? 'vendeur' : 'acheteur'

  // 1. Connexion (sans prénom) : le numéro doit déjà avoir un compte
  if (!prenom) {
    const { data: existe } = await admin.from('profils').select('id').eq('telephone', telephone).limit(1)
    if (!existe?.length) return { statut: 404, json: { erreur: 'Aucun compte avec ce numéro. Crée ton compte.' } }
  }

  // 2. Inscription : on crée le compte (« email_exists » veut dire qu'il existe déjà : on s'y connecte)
  let nouveau = false
  if (prenom) {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { prenom, telephone, role } })
    if (!error) {
      nouveau = true
      const { error: e2 } = await admin.from('profils').upsert({ id: data.user.id, prenom, telephone, role })
      if (e2) return { statut: 500, json: { erreur: 'Profil non enregistré', detail: e2.message } }
    } else if (error.code !== 'email_exists' && !/already/i.test(error.message)) {
      return { statut: 500, json: { erreur: 'Compte non créé', detail: error.message } }
    }
  }

  // 3. Jeton de connexion à usage unique (échangé dans l'app contre une vraie session)
  const { data: lien, error: e3 } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (e3) return { statut: 500, json: { erreur: 'Connexion impossible', detail: e3.message } }

  // 4. Le profil enregistré (prénom et rôle relus : on ne les redemande jamais)
  const uid = lien.user.id
  const { data: profil } = await admin.from('profils').select('prenom, telephone, role').eq('id', uid).maybeSingle()
  return {
    statut: 200,
    json: {
      token_hash: lien.properties.hashed_token,
      nouveau,
      profil: profil || { prenom: lien.user.user_metadata?.prenom || '', telephone, role: lien.user.user_metadata?.role || 'acheteur' },
    },
  }
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
