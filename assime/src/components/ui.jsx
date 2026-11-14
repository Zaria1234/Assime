// Petits composants partagés
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../store'

export const Icon = ({ d, size = 22, stroke = 'currentColor', width = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
)

export const I = {
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  search: null,
  mic: null,
  check: 'M5 12l5 5 9-10',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  list: 'M9 8h6M9 12h6M9 16h3',
  star: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z',
  shop: 'M4 10h16l-1-5H5zM5 10v9h14v-9M10 19v-5h4v5',
  user: null,
  speaker: 'M4 10v4h4l5 4V6l-5 4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
  turnLeft: 'M17 21v-9a4 4 0 0 0-4-4H5M9 4L5 8l4 4',
  turnRight: 'M7 21v-9a4 4 0 0 1 4-4h8M15 4l4 4-4 4',
  go: 'M3 11l18-8-8 18-2-8z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z',
  pin: 'M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z',
  globe: 'M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  qr: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M9 9h6v6H9z',
  alert: 'M12 3l9 16H3zM12 10v4M12 17h.01',
  undo: 'M9 14l-5-5 5-5M4 9h11a5 5 0 0 1 0 10h-3',
  plus: 'M12 5v14M5 12h14',
}

export const SearchIcon = ({ size = 20 }) => <Icon size={size}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Icon>
export const MicIcon = ({ size = 22 }) => <Icon size={size}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>
export const UserIcon = ({ size = 22 }) => <Icon size={size}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Icon>

export function BackButton({ to, label = 'Retour' }) {
  const nav = useNavigate()
  return (
    <button type="button" aria-label={label} onClick={() => (to ? nav(to) : nav(-1))} className="w-11 h-11 rounded-full border border-line flex items-center justify-center shrink-0 bg-white shadow-sm">
      <Icon d={I.back} size={20} />
    </button>
  )
}

export function TopBar({ title, sub, back, right }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-4">
      {back !== false && <BackButton to={back} />}
      <div className="flex-1 min-w-0">
        {sub && <div className="text-[13px] text-muted mb-0.5">{sub}</div>}
        <h1 className="font-display text-[22px] font-bold leading-tight truncate">{title}</h1>
      </div>
      {right}
    </div>
  )
}

export function BottomNav() {
  const { user } = useApp()
  const vendeur = user?.role === 'vendeur'
  const tabs = [
    { to: '/carte', label: 'Carte', icon: <Icon d={I.map} /> },
    { to: '/explorer', label: 'Explorer', icon: <Icon><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></Icon> },
    { to: '/liste', label: 'Ma liste', icon: <Icon><rect x="5" y="3" width="14" height="18" rx="2" /><path d={I.list} /></Icon> },
    vendeur
      ? { to: '/vendeur', label: 'Ma boutique', icon: <Icon d={I.shop} /> }
      : { to: '/missions', label: 'Missions', icon: <Icon d={I.star} /> },
    { to: '/profil', label: 'Profil', icon: <UserIcon /> },
  ]
  return (
    <div className="shrink-0 px-4 pt-2 pb-[max(14px,env(safe-area-inset-bottom))] bg-transparent">
      <nav aria-label="Navigation principale" className="bg-ink rounded-full p-1.5 flex items-center justify-between shadow-[0_16px_30px_-12px_rgba(22,24,29,.6)]">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} aria-label={t.label}
            className={({ isActive }) => 'h-12 rounded-full flex items-center justify-center gap-2 no-underline transition-all ' + (isActive ? 'bg-white text-ink px-4 text-[13px] font-bold' : 'text-white/60 w-12 hover:text-white')}>
            {({ isActive }) => (<>{t.icon}{isActive && <span>{t.label}</span>}</>)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function Screen({ children, nav = false, className = '', fond }) {
  return (
    <div className={'phone ' + className} style={fond ? { background: fond } : undefined}>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      {nav && <BottomNav />}
    </div>
  )
}

export function Banner({ titre, sous, icon = I.turnLeft, right }) {
  return (
    <div className="bg-white text-ink border border-line rounded-[24px] p-2.5 flex items-center gap-3 shadow-[0_12px_30px_-12px_rgba(22,24,29,.35)]">
      <span className="tile w-12 h-12 rounded-2xl"><Icon d={icon} size={26} stroke="#D4561C" width={2.4} /></span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[19px] font-bold leading-tight truncate">{titre}</div>
        {sous && <div className="text-[12px] text-muted truncate">{sous}</div>}
      </div>
      {right}
    </div>
  )
}

/** Laisser un coup de cœur après une visite : pouce levé ou pouce baissé, sans texte. */
export function VoteCoeur({ boutiqueId, compact = false }) {
  const { voter, mesVotes, coeursDe } = useApp()
  const vote = mesVotes[boutiqueId]
  const n = coeursDe(boutiqueId).affiches
  const bouton = (sens, label, path) => (
    <button type="button" onClick={() => voter(boutiqueId, sens)} aria-pressed={vote === sens} aria-label={label}
      className={'w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ' + (vote === sens ? (sens === 'plus' ? 'bg-[#137A52] border-[#137A52] text-white' : 'bg-ink border-ink text-white') : 'bg-white border-line text-ink')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill={vote === sens ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" style={sens === 'moins' ? { transform: 'rotate(180deg)' } : undefined}><path d={path} /></svg>
    </button>
  )
  const pouce = 'M7 10v10H4V10zM7 10l4-7c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7'
  return (
    <div className={'rounded-[22px] bg-white border border-line flex items-center gap-4 ' + (compact ? 'p-3' : 'p-4')}>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px]">Coup de cœur</div>
        <div className="text-[12px] text-muted mt-1 leading-snug">
          {vote === 'moins' ? 'Merci. Ton avis va seulement au vendeur, pour qu\'il s\'améliore.'
            : vote === 'plus' ? 'Merci ! Ton pouce est visible sur la carte.'
            : n > 0 ? `${n} visiteur${n > 1 ? 's ont' : ' a'} aimé. Et toi ?` : 'Tu es passé·e ici ? Donne ton avis.'}
        </div>
      </div>
      {bouton('plus', "J'ai aimé", pouce)}
      {bouton('moins', "Je n'ai pas aimé", pouce)}
    </div>
  )
}

/** État des données : sur le téléphone, en ligne (Supabase), envoi en cours ou erreur */
export function EtatServeur() {
  const { serveur } = useApp()
  const etats = {
    local: ['#6E7280', 'Données sur ce téléphone', 'Base partagée non configurée (voir docs/BACKEND.md)'],
    connexion: ['#A86A00', 'Connexion à la base…', 'Un instant'],
    synchro: ['#137A52', serveur.envoi ? 'Envoi en cours…' : 'Synchronisé en ligne', 'Boutiques, photos et coups de cœur partagés'],
    erreur: ['#B42318', 'Hors ligne', "La base ne répond pas : l'app continue sur le téléphone"],
  }
  const [couleur, titre, detail] = etats[serveur.etat] || etats.local
  return (
    <div className="px-4 py-3.5 flex items-center gap-3">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleur }} />
      <span className="flex-1 min-w-0">
        <b className="block text-sm">{titre}</b>
        <span className="block text-xs text-muted truncate">{serveur.erreur && serveur.etat === 'synchro' ? 'Dernier envoi refusé : ' + serveur.erreur : detail}</span>
      </span>
    </div>
  )
}
