// Parcours d'entrée : bienvenue, inscription, connexion, code, rôle
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../store'
import { Screen, TopBar, Icon, I } from '../components/ui'

const LANGUES = [{ id: 'ewe', nom: 'Éwé' }, { id: 'mina', nom: 'Mina' }, { id: 'fr', nom: 'Français' }]

export function Bienvenue() {
  const nav = useNavigate()
  const { langue, setLangue } = useApp()
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
          <Link to="/carte" className="text-center text-muted underline font-semibold py-1">Continuer sans compte</Link>
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

export function Inscription() {
  const nav = useNavigate()
  const { setUser } = useApp()
  const [prenom, setPrenom] = useState('')
  const [tel, setTel] = useState('')
  const [role, setRole] = useState('acheteur')
  const [ok, setOk] = useState(true)
  const valide = prenom.trim() && tel.replace(/\D/g, '').length >= 8 && ok
  const envoyer = e => {
    e.preventDefault()
    if (!valide) return
    setUser({ prenom: prenom.trim(), tel, role, verifie: false })
    nav('/code', { state: { suite: role === 'vendeur' ? '/vendeur' : '/carte' } })
  }
  return (
    <Screen fond="#FFFFFF">
      <form onSubmit={envoyer} className="flex-1 flex flex-col">
        <TopBar title="Créer mon compte" back="/" />
        <div className="flex-1 scroll px-6 flex flex-col">
          <p className="text-[15px] text-[#2D4A40]">Deux minutes, et tu gardes tes trajets et tes boutiques préférées.</p>
          <label htmlFor="prenom" className="label mt-5 mb-1.5">Prénom</label>
          <input id="prenom" className="field" placeholder="Ton prénom" value={prenom} onChange={e => setPrenom(e.target.value)} autoComplete="given-name" />
          <label htmlFor="tel" className="label mt-4 mb-1.5">Numéro de téléphone</label>
          <Telephone value={tel} onChange={setTel} />
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
        </div>
        <div className="px-6 pb-7 pt-3">
          <button type="submit" disabled={!valide} className="btn btn-main w-full h-[52px]">Recevoir mon code</button>
          <p className="mt-3.5 text-center text-sm text-[#2D4A40]">Déjà un compte ? <Link to="/connexion" className="font-semibold text-brand">Me connecter</Link></p>
        </div>
      </form>
    </Screen>
  )
}

export function Connexion() {
  const nav = useNavigate()
  const { user, setUser } = useApp()
  const [tel, setTel] = useState(user?.tel || '')
  const envoyer = e => {
    e.preventDefault()
    if (tel.replace(/\D/g, '').length < 8) return
    if (!user) setUser({ prenom: '', tel, role: 'acheteur', verifie: false })
    nav('/code', { state: { suite: user?.role === 'vendeur' ? '/vendeur' : '/carte' } })
  }
  return (
    <Screen fond="#FFFFFF">
      <form onSubmit={envoyer} className="flex-1 flex flex-col">
        <TopBar title="Me connecter" back="/" />
        <div className="flex-1 px-6 flex flex-col">
          <p className="text-[15px] text-[#2D4A40]">Entre ton numéro, on t'envoie un code. Pas besoin de mot de passe.</p>
          <label htmlFor="tel" className="label mt-6 mb-2">Numéro</label>
          <Telephone value={tel} onChange={setTel} />
          <button type="submit" className="btn btn-main h-[52px] mt-5">Recevoir le code par SMS</button>
          <div className="my-6 flex items-center gap-3 text-[13px] text-muted"><span className="flex-1 h-px bg-line" />ou<span className="flex-1 h-px bg-line" /></div>
          <button type="submit" className="btn btn-ghost h-[52px]">Recevoir le code par WhatsApp</button>
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
  const { user, setUser } = useApp()
  const [code, setCode] = useState('')
  const valider = e => {
    e.preventDefault()
    if (code.length < 6) return
    // Démo : tout code à 6 chiffres est accepté. Le back-end vérifiera le vrai code.
    setUser({ ...(user || {}), verifie: true })
    nav(user?.prenom ? state?.suite || '/carte' : '/role')
  }
  const masque = user?.tel ? user.tel.replace(/\D/g, '').replace(/^(\d{2})\d+(\d{2})$/, '$1 •• •• $2') : ''
  return (
    <Screen fond="#FFFFFF">
      <form onSubmit={valider} className="flex-1 flex flex-col">
        <TopBar title="Entre le code reçu" />
        <div className="px-6 flex flex-col">
          <p className="text-[15px] text-[#2D4A40]">Envoyé au +228 {masque}</p>
          <label htmlFor="code" className="label mt-6 mb-2">Code à 6 chiffres</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="field text-center font-display text-3xl tracking-[0.5em] h-16" placeholder="••••••" />
          <p className="mt-3 text-xs text-muted">Version de démonstration : n'importe quel code à 6 chiffres fonctionne.</p>
          <button type="submit" disabled={code.length < 6} className="btn btn-main h-[52px] mt-6">Valider</button>
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
