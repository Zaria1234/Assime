// Parcours d'entrée : bienvenue, inscription, connexion, code, rôle
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../store'
import { Screen, TopBar, Icon, I } from '../components/ui'
import { supabase, connexionTelephone, envoyerCodeEmail, verifierCodeEmail } from '../lib/supabase'

/** Message affiché à l'écran ; le détail technique part dans la console */
function messageSimple(err) {
  console.error('[Assimé] connexion', err)
  if (err?.simple) return err.simple
  if (/expired|invalid|token/i.test(err?.message || '')) return 'Code incorrect ou expiré.'
  if (/rate|limit|seconds/i.test(err?.message || '')) return 'Trop de demandes. Attends une minute et réessaie.'
  return "Ça n'a pas marché, réessaie."
}

const LANGUES = [{ id: 'ewe', nom: 'Éwé' }, { id: 'mina', nom: 'Mina' }, { id: 'fr', nom: 'Français' }]

export function Bienvenue() {
  const nav = useNavigate()
  const { langue, setLangue, continuerSansCompte } = useApp()
  return (
    <Screen fond="#FFFFFF">
      <div className="flex-1 flex flex-col px-6 pt-7 pb-7 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -left-20 top-1/3 w-64 h-64 rounded-full bg-sun/35 blur-3xl" />
        <div className="flex items-center gap-2.5 relative">
          <div className="w-10 h-10 rounded-[14px] bg-brand flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(23,107,82,.9)]">
            <Icon size={22} stroke="#fff" width={2.4}><path d={I.pin} /><circle cx="12" cy="9" r="2.5" /></Icon>
          </div>
          <span className="h-display text-xl">Assimé</span>
        </div>
        <div className="relative mt-6 h-[190px] rounded-[30px] bg-white border border-line shadow-[0_20px_40px_-24px_rgba(23,107,82,.5)] overflow-hidden">
          <svg viewBox="0 0 340 190" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <rect width="340" height="190" fill="#F4F1E6" />
            <g fill="#E2E8DF">
              <rect x="14" y="14" width="90" height="62" rx="10" /><rect x="120" y="14" width="96" height="62" rx="10" /><rect x="232" y="14" width="94" height="62" rx="10" />
              <rect x="14" y="94" width="90" height="82" rx="10" /><rect x="120" y="94" width="96" height="82" rx="10" /><rect x="232" y="94" width="94" height="82" rx="10" />
            </g>
            <path d="M60 160 V85 H168 V45 H280 V135" fill="none" stroke="#176B52" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 10" />
            <circle cx="60" cy="160" r="9" fill="#F5A623" stroke="#fff" strokeWidth="3" />
            <circle cx="280" cy="135" r="11" fill="#176B52" stroke="#fff" strokeWidth="4" />
          </svg>
          <span className="absolute left-3 bottom-3 px-2.5 py-1 rounded-full bg-sun text-ink text-[11px] font-bold">Ma moto</span>
          <span className="absolute right-3 top-3 px-2.5 py-1 rounded-full bg-white text-ink text-[11px] font-bold shadow">Boutique de pagnes · 2 min</span>
        </div>
        <h1 className="h-display text-[36px] leading-[1.05] mt-6 relative">
          Ne te <span className="text-ink/35">perds</span> plus à <span className="text-brand">Asigamé.</span>
        </h1>
        <p className="text-[15px] text-muted leading-relaxed mt-2.5 relative">Retrouve ta moto, trouve ta boutique, gère ton budget. Guidé·e dans ta langue.</p>
        <div className="grid grid-cols-3 gap-2 mt-5 relative" role="group" aria-label="Langue">
          {LANGUES.map(l => (
            <button key={l.id} type="button" onClick={() => setLangue(l.id)} aria-pressed={langue === l.id}
              className={'h-11 rounded-full text-[14px] font-semibold transition-all ' + (langue === l.id ? 'bg-[#E6F4EC] text-brand border-2 border-brand' : 'bg-white text-ink border border-line')}>
              {l.nom}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-4" />
        <div className="flex flex-col gap-2.5 relative">
          <button type="button" onClick={() => nav('/inscription')} className="h-14 rounded-full bg-sun text-ink pl-1.5 pr-5 flex items-center gap-3 shadow-[0_12px_26px_-10px_rgba(245,166,35,.9)]">
            <span className="w-11 h-11 rounded-full bg-white text-ink flex items-center justify-center text-xl font-bold nudge">»</span>
            <span className="flex-1 text-center font-bold -ml-11">Créer mon compte</span>
          </button>
          <Link to="/connexion" className="btn h-[50px] bg-white text-ink border border-line">J'ai déjà un compte</Link>
          <Link to="/carte" onClick={continuerSansCompte} className="text-center text-muted underline font-semibold py-1">Continuer sans compte</Link>
        </div>
      </div>
    </Screen>
  )
}

function Telephone({ value, onChange }) {
  return (
    <div className="flex gap-2.5">
      <div className="h-[52px] px-3.5 rounded-[14px] border border-field bg-white flex items-center font-semibold">+228</div>
      <input id="tel" type="tel" inputMode="numeric" placeholder="90 00 00 00" value={value} onChange={e => onChange(e.target.value)} className="field flex-1 min-w-0" />
    </div>
  )
}

const emailValide = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

/** Choix « Par téléphone » / « Par e-mail » (seulement si la base en ligne est branchée) */
function Canal({ canal, setCanal }) {
  if (!supabase) return null
  return (
    <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-[#F2F4F3] mt-4" role="group" aria-label="Moyen de connexion">
      {[['tel', 'Par téléphone'], ['email', 'Par e-mail']].map(([id, t]) => (
        <button key={id} type="button" onClick={() => setCanal(id)} aria-pressed={canal === id}
          className={'h-10 rounded-full text-[14px] font-semibold ' + (canal === id ? 'bg-white text-brand shadow' : 'text-muted')}>{t}</button>
      ))}
    </div>
  )
}

function ChampContact({ canal, tel, setTel, email, setEmail }) {
  return canal === 'email' ? (
    <>
      <label htmlFor="email" className="label mt-4 mb-1.5">Adresse e-mail</label>
      <input id="email" type="email" inputMode="email" autoComplete="email" className="field" placeholder="toi@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
      <p className="mt-2 text-xs text-muted">L'e-mail peut prendre une minute. Pense à regarder dans les spams.</p>
    </>
  ) : (
    <>
      <label htmlFor="tel" className="label mt-4 mb-1.5">Numéro de téléphone</label>
      <Telephone value={tel} onChange={setTel} />
    </>
  )
}

export function Inscription() {
  const nav = useNavigate()
  const { setUser, reinitialiserDonneesPerso } = useApp()
  const [canal, setCanal] = useState('tel')
  const [prenom, setPrenom] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('acheteur')
  const [ok, setOk] = useState(true)
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState('')
  const contactOk = canal === 'email' ? emailValide(email) : tel.replace(/\D/g, '').length >= 8
  const valide = prenom.trim() && contactOk && ok && !attente
  const envoyer = async e => {
    e.preventDefault()
    if (!valide) return
    const infos = { prenom: prenom.trim(), role }
    if (!supabase) { // mode local : tout reste sur le téléphone, un nouveau compte part de zéro
      reinitialiserDonneesPerso()
      setUser({ ...infos, tel, verifie: false })
      return nav('/code', { state: { canal: 'local', suite: role === 'vendeur' ? '/vendeur' : '/carte' } })
    }
    if (canal === 'email') {
      setAttente(true); setErreur('')
      try { await envoyerCodeEmail(email.trim(), infos) } catch (err) { setAttente(false); return setErreur(messageSimple(err)) }
      return nav('/code', { state: { canal: 'email', email: email.trim(), ...infos } })
    }
    nav('/code', { state: { canal: 'tel', telephone: tel, ...infos } })
  }
  return (
    <Screen fond="#FFFFFF">
      <form onSubmit={envoyer} className="flex-1 flex flex-col">
        <TopBar title="Créer mon compte" back="/" />
        <div className="flex-1 scroll px-6 flex flex-col">
          <p className="text-[15px] text-[#2D4A40]">Deux minutes, et tu gardes ta liste, tes trajets et tes boutiques préférées.</p>
          <Canal canal={canal} setCanal={setCanal} />
          <label htmlFor="prenom" className="label mt-5 mb-1.5">Prénom</label>
          <input id="prenom" className="field" placeholder="Ton prénom" value={prenom} onChange={e => setPrenom(e.target.value)} autoComplete="given-name" />
          <ChampContact canal={canal} tel={tel} setTel={setTel} email={email} setEmail={setEmail} />
          <div className="label mt-5 mb-2">Je crée un compte pour…</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[{ id: 'acheteur', t: 'Acheter', s: 'Me repérer, trouver des boutiques' }, { id: 'vendeur', t: 'Vendre', s: 'Ma boutique sur la carte, et la navigation aussi' }].map(r => (
              <button key={r.id} type="button" onClick={() => setRole(r.id)} aria-pressed={role === r.id}
                className={'rounded-[14px] bg-white p-3.5 text-left ' + (role === r.id ? 'border-2 border-brand bg-[#E6F4EC]' : 'border border-field')}>
                <span className="font-semibold">{r.t}</span><span className="block text-xs text-muted mt-1">{r.s}</span>
              </button>
            ))}
          </div>
          <label className="mt-4 flex gap-2.5 items-start text-[13px] text-[#2D4A40] leading-snug">
            <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} className="w-5 h-5 accent-accent mt-0.5" />
            J'accepte les conditions d'utilisation. Mes trajets restent sur mon téléphone sauf si je choisis de les partager.
          </label>
          {erreur && <p className="mt-3 text-sm text-red-700" role="alert">{erreur}</p>}
        </div>
        <div className="px-6 pb-7 pt-3">
          <button type="submit" disabled={!valide} className="btn btn-main w-full h-[52px]">{attente ? 'Envoi…' : 'Recevoir mon code'}</button>
          <p className="mt-3.5 text-center text-sm text-[#2D4A40]">Déjà un compte ? <Link to="/connexion" className="font-semibold text-brand">Me connecter</Link></p>
        </div>
      </form>
    </Screen>
  )
}

export function Connexion() {
  const nav = useNavigate()
  const { user, setUser } = useApp()
  const [canal, setCanal] = useState('tel')
  const [tel, setTel] = useState(user?.tel?.replace(/^228/, '') || '')
  const [email, setEmail] = useState(user?.email || '')
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState('')
  const valide = (canal === 'email' ? emailValide(email) : tel.replace(/\D/g, '').length >= 8) && !attente
  const envoyer = async e => {
    e.preventDefault()
    if (!valide) return
    if (!supabase) {
      if (!user) setUser({ prenom: '', tel, role: 'acheteur', verifie: false })
      return nav('/code', { state: { canal: 'local', suite: user?.role === 'vendeur' ? '/vendeur' : '/carte' } })
    }
    if (canal === 'email') {
      setAttente(true); setErreur('')
      try { await envoyerCodeEmail(email.trim()) } catch (err) { setAttente(false); return setErreur(messageSimple(err)) }
      return nav('/code', { state: { canal: 'email', email: email.trim() } })
    }
    nav('/code', { state: { canal: 'tel', telephone: tel } })
  }
  return (
    <Screen fond="#FFFFFF">
      <form onSubmit={envoyer} className="flex-1 flex flex-col">
        <TopBar title="Me connecter" back="/" />
        <div className="flex-1 px-6 flex flex-col">
          <p className="text-[15px] text-[#2D4A40]">{canal === 'email' ? 'Entre ton e-mail, on t\'envoie un code.' : 'Entre ton numéro, on t\'envoie un code.'} Pas besoin de mot de passe.</p>
          <Canal canal={canal} setCanal={setCanal} />
          <ChampContact canal={canal} tel={tel} setTel={setTel} email={email} setEmail={setEmail} />
          {erreur && <p className="mt-3 text-sm text-red-700" role="alert">{erreur}</p>}
          <button type="submit" disabled={!valide} className="btn btn-main h-[52px] mt-5">{attente ? 'Envoi…' : canal === 'email' ? 'Recevoir le code par e-mail' : 'Recevoir le code par SMS'}</button>
          <div className="flex-1" />
          <p className="text-center text-sm text-[#2D4A40] mb-7">Pas encore de compte ? <Link to="/inscription" className="font-semibold text-brand">Créer un compte</Link></p>
        </div>
      </form>
    </Screen>
  )
}

export function Code() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { user, setUser, ouvrirSession } = useApp()
  const [code, setCode] = useState('')
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState('')
  const canal = state?.canal || 'local'
  const suite = role => (role === 'vendeur' ? '/vendeur' : '/carte')
  const valider = async e => {
    e.preventDefault()
    if (code.length < 6 || attente) return
    if (canal === 'local') {
      // Sans base en ligne : tout code à 6 chiffres est accepté, le compte reste sur le téléphone
      setUser({ ...(user || {}), verifie: true })
      return nav(user?.prenom ? state?.suite || '/carte' : '/role')
    }
    setAttente(true); setErreur('')
    try {
      if (canal === 'tel') {
        const { uid, profil } = await connexionTelephone({ telephone: state.telephone, prenom: state.prenom, role: state.role, code })
        ouvrirSession(uid, { prenom: profil.prenom, tel: profil.telephone, role: profil.role })
        return nav(profil.prenom ? suite(profil.role) : '/role', { replace: true })
      }
      const { uid, meta } = await verifierCodeEmail(state.email, code)
      const prenom = state.prenom || meta.prenom || ''
      const role = state.role || meta.role || 'acheteur'
      ouvrirSession(uid, { prenom, role, email: state.email })
      nav(prenom ? suite(role) : '/role', { replace: true })
    } catch (err) {
      setAttente(false)
      setErreur(messageSimple(err))
    }
  }
  const masque = canal === 'email' ? state?.email
    : '+228 ' + String(state?.telephone || user?.tel || '').replace(/\D/g, '').replace(/^(\d{2})\d+(\d{2})$/, '$1 •• •• $2')
  return (
    <Screen fond="#FFFFFF">
      <form onSubmit={valider} className="flex-1 flex flex-col">
        <TopBar title="Entre le code reçu" />
        <div className="px-6 flex flex-col">
          <p className="text-[15px] text-[#2D4A40]">Envoyé à {masque}</p>
          <label htmlFor="code" className="label mt-6 mb-2">Code à 6 chiffres</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="field text-center font-display text-3xl tracking-[0.5em] h-16" placeholder="••••••" />
          <p className="mt-3 text-xs text-muted">
            {canal === 'email' ? "L'e-mail peut prendre une minute. S'il contient un lien « Log In » au lieu d'un code, touche simplement le lien : tu seras connecté·e."
              : "Version de démonstration : n'importe quel code à 6 chiffres fonctionne."}
          </p>
          {erreur && <p className="mt-3 text-sm text-red-700" role="alert">{erreur}</p>}
          <button type="submit" disabled={code.length < 6 || attente} className="btn btn-main h-[52px] mt-6">{attente ? 'Connexion…' : 'Valider'}</button>
        </div>
      </form>
    </Screen>
  )
}

export function Role() {
  const nav = useNavigate()
  const { user, setUser } = useApp()
  const [prenom, setPrenom] = useState(user?.prenom || '')
  const choisir = role => {
    setUser({ ...(user || {}), prenom: prenom.trim() || 'Toi', role })
    nav(role === 'vendeur' ? '/vendeur' : '/carte')
  }
  return (
    <Screen fond="#FFFFFF">
      <TopBar title="Dis-nous qui tu es" back={false} />
      <div className="px-6 flex flex-col">
        <label htmlFor="prenom" className="label mb-1.5">Ton prénom</label>
        <input id="prenom" className="field" placeholder="Ton prénom" value={prenom} onChange={e => setPrenom(e.target.value)} />
        <div className="label mt-6 mb-2.5">Tu utilises l'app pour…</div>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => choisir('acheteur')} className="card p-4 flex gap-3.5 items-center text-left border-2 !border-primary">
            <span className="w-12 h-12 rounded-[14px] bg-[#E6F4EC] flex items-center justify-center shrink-0"><Icon d="M5 8h14l-1.5 11h-11zM9 8a3 3 0 0 1 6 0" stroke="#176B52" /></span>
            <span><b className="block">Acheter et me repérer</b><span className="text-[13px] text-muted">Trajets, favoris, recherche de boutiques</span></span>
          </button>
          <button type="button" onClick={() => choisir('vendeur')} className="card p-4 flex gap-3.5 items-center text-left">
            <span className="w-12 h-12 rounded-[14px] bg-[#E6F4EC] flex items-center justify-center shrink-0"><Icon d={I.shop} stroke="#176B52" /></span>
            <span><b className="block">Vendre au marché</b><span className="text-[13px] text-muted">Ma boutique sur la carte, et la navigation aussi</span></span>
          </button>
        </div>
        <p className="text-xs text-muted text-center mt-6">Tu pourras changer plus tard dans ton profil.</p>
      </div>
    </Screen>
  )
}
