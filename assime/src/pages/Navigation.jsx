// Carte, trajet, retour au point de départ, recherche, fiche boutique, guidage
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useApp } from '../store'
import MapView, { BoutonRecentrer } from '../components/MapView'
import { Screen, TopBar, Banner, Icon, I, SearchIcon, MicIcon, BackButton, VoteCoeur } from '../components/ui'
import { LIEUX_UTILES } from '../data/demo'
import { Wax, GlassIcon, Coeurs } from '../components/art'
import { lireImage } from '../lib/image'
import { chargerGraphe, plusCourtChemin, prochaineConsigne } from '../lib/itineraire'
import { distance, bearing, directionIndex, fmtDist, fmtMoney, pathLength, cutLoops } from '../lib/geo'
import { rechercher, norm, categoriesDe } from '../lib/ia'
import { ecouter, microDisponible } from '../lib/voix'
import { chercherSurCarte } from '../lib/carte'
import { LANGUES, voixDe } from '../i18n'
import { horairesLisibles } from '../lib/horaires'

const Card = ({ children, className = '' }) => (
  <div className={'bg-white rounded-[24px] p-3.5 border border-line shadow-[0_16px_40px_-18px_rgba(23,63,51,.45)] ' + className}>{children}</div>
)

/** Gros bouton bien visible pour couper / remettre la voix du guidage */
function SonLigne() {
  const { voix, setVoix, t } = useApp()
  return (
    <button type="button" onClick={() => setVoix(!voix)} aria-pressed={voix}
      className={'h-11 w-full rounded-full flex items-center justify-center gap-2 text-[14px] font-semibold border ' + (voix ? 'bg-white border-line text-ink' : 'bg-ink border-ink text-white')}>
      <Icon d={voix ? I.speaker : 'M4 10v4h4l5 4V6l-5 4H4zM17 9l5 6M22 9l-5 6'} size={18} />{voix ? t('son.couper') : t('son.coupe')}
    </button>
  )
}

function SonBouton() {
  const { voix, setVoix, t } = useApp()
  return (
    <button type="button" onClick={() => setVoix(!voix)} aria-pressed={voix} aria-label={voix ? t('son.couperVoix') : t('son.activerVoix')}
      className={'w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ' + (voix ? 'bg-ink border-ink text-white' : 'bg-white border-line text-muted')}>
      <Icon d={voix ? I.speaker : 'M4 10v4h4l5 4V6l-5 4H4zM17 9l5 6M22 9l-5 6'} size={20} />
    </button>
  )
}

/** Pastilles de la carte : catégories de boutiques et types de repères (mêmes icônes que les marqueurs) */
const FILTRES_CARTE = ['Pagnes wax', 'Épices', 'Alimentation', 'Mèches et coiffure', 'Chaussures', 'Sacs', 'Cosmétiques', 'Artisanat', 'Pharmacie', 'Banque', 'Toilettes', 'Eau', 'Parking', 'Mobile money', 'Église']

export function Carte() {
  const nav = useNavigate()
  const { user, moi, simule, gpsIndispo, boutiques, moto, enregistre, demarrerTrajet, trajet, langue, setLangue, raccourcis, ajouterRaccourci, retirerRaccourci, coeursDe, t, lieuTraduit } = useApp()
  const [edition, setEdition] = useState(false)
  const [nouveau, setNouveau] = useState('')
  const [filtre, setFiltre] = useState(null) // pastille choisie : la carte n'affiche que ces lieux
  const carte = useRef(null)
  const lancer = simulation => { demarrerTrajet({ simulation: simulation || gpsIndispo }); nav('/trajet') }
  const ref = moi || trajet[trajet.length - 1]
  const dMoto = moto && ref ? distance(ref, moto) : null
  const iconeDe = x => categoriesDe(x)[0] || LIEUX_UTILES.find(l => norm(l.nom + ' ' + l.type).includes(norm(x)))?.type || 'Lieu'
  const i = LANGUES.findIndex(l => l.id === langue)
  const suivante = LANGUES[(i + 1) % LANGUES.length]
  const lieux = useMemo(() => LIEUX_UTILES.map(lieuTraduit), [lieuTraduit])
  const boutiquesVues = filtre ? boutiques.filter(b => b.categorie === filtre) : boutiques
  const lieuxVus = filtre ? lieux.filter(l => l.type === filtre) : lieux
  return (
    <Screen nav>
      <div className="relative flex-1 min-h-0">
        <MapView className="absolute inset-0" moi={moi} moto={moto} boutiques={boutiquesVues.map(b => ({ ...b, coeurs: coeursDe(b.id).affiches }))} lieux={lieuxVus} showToggle={false}
          onBoutique={b => nav('/boutique/' + b.id)} fit={moi ? [moi] : undefined} controle={carte} />
        <div className="absolute left-3 right-3 top-3 z-[500] flex flex-col gap-2">
          <div className="bg-white border border-line rounded-[24px] p-1.5 flex items-center gap-2">
            <Link to="/profil" aria-label={t('carte.monProfil')} className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-display font-bold no-underline shrink-0">{(user?.prenom || 'A')[0].toUpperCase()}</Link>
            <div className="flex-1 min-w-0 leading-tight text-ink">
              <span className="block text-[11px] text-muted">{t('carte.bonjour', { nom: user?.prenom || '' })}</span>
              <span className="block h-display text-[17px] truncate">{t('carte.question')}</span>
            </div>
            <button type="button" onClick={() => setLangue(suivante.id)} aria-label={t('carte.langue', { langue: LANGUES[i]?.nom || 'Français' })}
              className="h-9 px-2.5 rounded-full bg-white border border-line text-ink text-[12px] font-semibold shrink-0">{LANGUES[i]?.nom || 'Français'}</button>
          </div>
          <div className="h-12 rounded-full bg-white border border-line flex items-center pl-4 pr-1.5">
            <Link to="/recherche" className="flex-1 h-full flex items-center gap-2.5 no-underline text-muted"><SearchIcon size={20} /><span className="text-[14px]">{t('carte.rechercher')}</span></Link>
            <Link to="/ia" aria-label={t('carte.parlerIADirect')} className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center"><MicIcon size={18} /></Link>
          </div>
          <div className="-mx-3 px-3 flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label={t('carte.filtres')}>
            {FILTRES_CARTE.map(c => (
              <button key={c} type="button" aria-pressed={filtre === c}
                onClick={e => { setFiltre(f => (f === c ? null : c)); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' }) }}
                className={'h-9 pl-1 pr-3 rounded-full flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap shrink-0 border ' + (filtre === c ? 'bg-brand text-white border-brand' : 'bg-white text-ink border-line')}>
                <GlassIcon cat={c} size={28} />{t('filtre.' + c)}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {raccourcis.map(c => (
              <span key={c} className="h-9 rounded-full bg-white border border-line flex items-center">
                <Link to={'/recherche?q=' + encodeURIComponent(c)} className="h-9 pl-1.5 pr-3 flex items-center gap-1.5 text-ink text-[13px] font-semibold no-underline">
                  <GlassIcon cat={iconeDe(c)} size={26} />{c}
                </Link>
                {edition && <button type="button" onClick={() => retirerRaccourci(c)} aria-label={t('commun.retirerNom', { nom: c })} className="w-7 h-7 mr-1 rounded-full bg-[#F2F4F3] text-muted text-sm">×</button>}
              </span>
            ))}
            {edition ? (
              <form onSubmit={e => { e.preventDefault(); ajouterRaccourci(nouveau); setNouveau('') }} className="h-9 rounded-full bg-white border border-line flex items-center pl-3 pr-1 gap-1">
                <label htmlFor="racc" className="sr-only">{t('carte.nouveauRaccourci')}</label>
                <input id="racc" autoFocus value={nouveau} onChange={e => setNouveau(e.target.value)} placeholder={t('carte.exRaccourci')} className="w-24 bg-transparent text-[13px] outline-none" />
                <button type="submit" className="h-7 px-2.5 rounded-full bg-ink text-white text-[12px] font-semibold">{t('commun.ajouter')}</button>
                <button type="button" onClick={() => setEdition(false)} className="h-7 px-2 text-[12px] font-semibold text-muted">{t('commun.fini')}</button>
              </form>
            ) : (
              <button type="button" onClick={() => setEdition(true)} aria-label={t('carte.gererRaccourcis')} className="h-9 w-9 rounded-full bg-white border border-line text-ink text-lg font-semibold">+</button>
            )}
          </div>
          {simule && <span className="self-start bg-white border border-line rounded-full px-2.5 py-1 text-[11px] font-semibold">{t('carte.positionSimulee')}</span>}
        </div>
        <div className="absolute left-3 right-3 bottom-1 z-[600] flex flex-col gap-2">
          <div className="self-end"><BoutonRecentrer controle={carte} /></div>
          <div className="flex items-end justify-between gap-2">
          {moto ? (
            <Link to="/retour" className="min-w-0 h-10 pl-1.5 pr-3.5 rounded-full bg-white border border-line flex items-center gap-2 text-ink text-[13px] font-semibold no-underline">
              <span className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><Icon d={I.undo} size={15} /></span><span className="truncate">{t('carte.pointDepart')} · {dMoto != null ? fmtDist(dMoto) : '—'}</span>
            </Link>
          ) : <span />}
            <Link to="/ia" className="h-11 pl-1.5 pr-4 rounded-full bg-white border border-line flex items-center gap-2 text-ink text-[13px] font-semibold no-underline shrink-0">
              <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center"><MicIcon size={16} /></span>{t('carte.parlerIA')}
            </Link>
          </div>
          {enregistre ? (
            <Link to="/trajet" className="btn btn-main h-14 justify-between pl-5 pr-1.5 no-underline"><span className="flex items-center gap-2.5"><span className="w-2.5 h-2.5 rounded-full bg-ink animate-pulse" />{t('carte.trajetEnCours')}</span></Link>
          ) : (
            <button type="button" onClick={() => lancer(false)} className="btn btn-main !shadow-none h-14 justify-between pl-5 pr-1.5 text-[16px]">{t('carte.enregistrer')}</button>
          )}
          <button type="button" onClick={() => lancer(true)} className="text-[11px] text-ink/80 underline self-center bg-white px-2.5 py-0.5 rounded-full">{t('carte.modeDemo')}</button>
        </div>
      </div>
    </Screen>
  )
}

/** Écran plein carte : bandeau en haut, carte d'actions en bas, bouton « Recentrer » juste au-dessus */
function MapShell({ map, top, bottom, controle }) {
  return (
    <Screen>
      <div className="relative flex-1 min-h-0">
        {map}
        <div className="absolute left-3 right-3 top-3 z-[600]">{top}</div>
        <div className="absolute left-3 right-3 bottom-3 z-[600] flex flex-col gap-2">
          {controle && <div className="self-end"><BoutonRecentrer controle={controle} /></div>}
          {bottom}
        </div>
      </div>
    </Screen>
  )
}

export function Trajet() {
  const nav = useNavigate()
  const { trajet, moto, moi, enregistre, arreterTrajet, debut, demo, arrets, marquerArret, enPause, motifPause, mettreEnPause, poursuivre, t } = useApp()
  const [, tick] = useState(0)
  const carte = useRef(null)
  useEffect(() => { const x = setInterval(() => tick(n => n + 1), 5000); return () => clearInterval(x) }, [])
  const minutes = debut ? Math.max(0, Math.round((Date.now() - debut) / 60000)) : 0
  const terminer = () => { arreterTrajet(); nav('/carte') }
  return (
    <MapShell controle={carte}
      map={<MapView className="absolute inset-0" moi={moi} moto={moto} trajet={trajet} arrets={arrets} togglePos="right-3 top-[76px]" fit={trajet.length > 1 ? trajet : moi ? [moi] : undefined} controle={carte} />}
      top={
        <div className="glass rounded-[22px] p-2 flex items-center gap-2.5 shadow-lg">
          <BackButton to="/carte" />
          <div className="flex-1 leading-tight">
            <div className="flex items-center gap-1.5 font-bold">
              {enregistre && <span className={'w-2.5 h-2.5 rounded-full ' + (enPause ? 'bg-sun' : 'bg-red-500 animate-pulse')} />}{!enregistre ? t('trajet.enregistre') : enPause ? t('trajet.enPause') : t('trajet.enregistrement')}
              {demo && <span className="ml-1 px-2 py-0.5 rounded-full bg-[#F2F4F3] text-[10px]">{t('trajet.demo')}</span>}
            </div>
            <div className="text-[12px] text-muted">{moto ? t('trajet.departMarque') : t('trajet.attenteGps')}</div>
          </div>
        </div>
      }
      bottom={
        <Card className="flex flex-col gap-2.5">
          <div className="grid grid-cols-4 gap-1.5">
            {[[minutes + ' min', t('trajet.duree')], [fmtDist(pathLength(trajet)), t('trajet.parcourus')], [trajet.length, t('trajet.points')], [arrets.length, t('trajet.arrets')]].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-[#F5F7F6] py-2 text-center"><div className="font-bold text-[15px]">{v}</div><div className="text-[11px] text-muted">{l}</div></div>
            ))}
          </div>
          {enPause && (
            <div className="rounded-2xl bg-[#E6F4EC] px-3.5 py-3 text-[13px] text-[#0F5440] leading-snug" role="status">
              {motifPause === 'arret' ? <><b>{t('trajet.arretMarque', { n: arrets.length })}</b> {t('trajet.pauseArret')}</> : t('trajet.pauseManuelle')}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={marquerArret} disabled={!enregistre} className="btn btn-ghost flex-1 h-12 text-sm"><Icon d={I.pin} size={18} />{t('trajet.marquerArret')}</button>
            {enPause
              ? <button type="button" onClick={poursuivre} className="btn bg-brand text-white flex-1 h-12 text-sm"><Icon d="M8 5l11 7-11 7z" size={18} />{t('trajet.continuer')}</button>
              : <button type="button" onClick={mettreEnPause} disabled={!enregistre} className="btn btn-ghost flex-1 h-12 text-sm"><Icon size={18}><rect x="6" y="6" width="12" height="12" rx="2" /></Icon>{t('trajet.arreter')}</button>}
          </div>
          <button type="button" disabled={trajet.length < 2} onClick={() => { arreterTrajet(); nav('/retour') }} className="btn btn-main h-[52px]">{t('trajet.retourDepart')}</button>
          {enregistre && <button type="button" onClick={terminer} className="self-center h-9 px-3 text-[13px] text-muted underline underline-offset-2">{t('trajet.terminer')}</button>}
        </Card>
      }
    />
  )
}

export function Retour() {
  const nav = useNavigate()
  const { trajet, moto, moi, dire, arrets, t } = useApp()
  const carte = useRef(null)
  const route = useMemo(() => {
    if (trajet.length < 2) return []
    let r = cutLoops([...trajet].reverse())
    if (moi && distance(moi, r[0]) > 10) r = cutLoops([moi, ...r])
    return r
  }, [trajet, moi])
  const ici = moi || route[0]
  const d = ici && moto ? distance(ici, moto) : null
  const arrive = d !== null && d < 10
  const titre = !moto ? t('retour.aucunTrajet') : arrive ? t('commun.arrive') : t('retour.distance', { d: fmtDist(d) })
  const sous = !moto ? t('retour.enregistreEnArrivant') : arrive ? t('retour.justeLa') : t('commun.direction', { dir: t('dir.' + directionIndex(bearing(ici, moto))) })
  const gagne = pathLength(trajet) - pathLength(route)
  useEffect(() => { if (moto) dire(titre + '. ' + sous) }, [arrive]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <MapShell controle={carte}
      map={<MapView className="absolute inset-0" moi={moi} moto={moto} fantome={trajet} route={route} arrets={arrets} togglePos="right-3 top-[124px]" fit={route.length ? route : undefined} controle={carte} />}
      top={<div className="flex gap-2 items-center"><BackButton to="/carte" /><div className="flex-1 min-w-0"><Banner titre={titre} sous={sous} right={<SonBouton />} /></div></div>}
      bottom={
        <Card className="flex flex-col gap-2.5">
          {moto ? (
            <>
              <div className="flex items-baseline justify-between">
                <div className="h-display text-[22px]">{fmtDist(pathLength(route))} <span className="text-muted text-base font-medium">· {Math.max(1, Math.round(pathLength(route) / 70))} min</span></div>
                {gagne > 15 && <span className="px-2.5 py-1 rounded-full bg-sky-soft text-ink text-[12px] font-semibold">−{fmtDist(gagne)}</span>}
              </div>
              <p className="text-[13px] text-muted leading-snug">{gagne > 15 ? t('retour.boucle') : t('retour.envers')}{arrets.length ? ' ' + t('retour.arretsCarte', { n: arrets.length }) : ''}</p>
            </>
          ) : <p className="text-sm text-muted">{t('retour.aide')}</p>}
          <SonLigne />
          <div className="flex gap-2">
            <button type="button" onClick={() => nav('/carte')} className="btn btn-ghost flex-1 h-12 text-sm">{t('retour.arreterGuidage')}</button>
            {arrive && <button type="button" onClick={() => nav('/carte')} className="btn btn-main no-arrow flex-1 h-12 text-sm">{t('commun.terminer')}</button>}
          </div>
        </Card>
      }
    />
  )
}

export function Recherche() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [ecoute, setEcoute] = useState(false)
  const [erreur, setErreur] = useState('')
  const [carte, setCarte] = useState(null) // résultats OpenStreetMap
  const [charge, setCharge] = useState(false)
  const { boutiques, moi, langue, t, tc, lieuTraduit } = useApp()
  const resultat = useMemo(() => (q.trim() ? rechercher(q, boutiques, moi, [], langue) : null), [q, boutiques, moi, langue])
  const reperes = useMemo(() => {
    const x = norm(q)
    if (x.length < 3) return []
    return LIEUX_UTILES.map(lieuTraduit).filter(l => norm(l.nom + ' ' + l.type + ' ' + l.note + ' ' + tc(l.type)).split(' ').some(w => w.length > 2 && x.split(' ').some(m => m.length > 2 && w.startsWith(m))))
  }, [q, lieuTraduit, tc])
  const surCarte = async e => {
    e?.preventDefault()
    if (!q.trim()) return
    setCharge(true); setErreur(''); setCarte(null)
    try { setCarte(await chercherSurCarte(q)) } catch { setErreur('recherche.erreurCarte') } finally { setCharge(false) }
  }
  const micro = async () => {
    setErreur(''); setEcoute(true)
    try { setQ(await ecouter(voixDe(langue))) } catch (e) { console.error('[Assimé] micro', e); setErreur('erreur.micro') } finally { setEcoute(false) }
  }
  const allerA = r => nav(`/guidage/ext?lat=${r.pos[0]}&lng=${r.pos[1]}&nom=${encodeURIComponent(r.nom)}&note=${encodeURIComponent(r.adresse || '')}`)
  return (
    <Screen nav>
      <TopBar title={t('recherche.titre')} back="/carte" />
      <form onSubmit={surCarte} className="px-5 flex gap-2">
        <label htmlFor="q" className="sr-only">{t('recherche.label')}</label>
        <input id="q" className="field flex-1" placeholder={t('recherche.placeholder')} value={q} onChange={e => { setQ(e.target.value); setCarte(null) }} autoFocus />
        <button type="button" onClick={micro} disabled={!microDisponible() || ecoute} aria-label={t('recherche.parler')}
          className={'w-[52px] h-[52px] rounded-full bg-ink text-white flex items-center justify-center shrink-0 disabled:opacity-40 ' + (ecoute ? 'animate-pulse' : '')}><MicIcon /></button>
      </form>
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 py-4 flex flex-col gap-3.5">
        {!q.trim() && <p className="text-sm text-muted">{t('recherche.aide')}</p>}
        {resultat && (
          <>
            <div className="section-title">{t('recherche.boutiques')}</div>
            {resultat.resultats.length ? resultat.resultats.map(b => (
              <div key={b.id} className="card p-3 flex gap-3.5 items-center">
                <Wax image={b.couverture} className="w-[52px] h-[52px] rounded-[16px] shrink-0" />
                <Link to={'/boutique/' + b.id} className="flex-1 min-w-0 no-underline text-ink">
                  <div className="font-semibold truncate">{b.nom}</div>
                  <div className="text-[13px] text-muted">{tc(b.categorie)}{b.distance != null ? ' · ' + fmtDist(b.distance) : ''}{isFinite(b.prixMin) ? ' · ' + t('commun.des', { prix: fmtMoney(b.prixMin) }) : ''}</div>
                </Link>
                <Link to={'/guidage/' + b.id} className="btn btn-ghost h-10 px-3 text-[13px]">{t('commun.yAller')}</Link>
              </div>
            )) : <p className="text-[13px] text-muted">{t('recherche.aucune', { q })}</p>}
          </>
        )}
        {reperes.length > 0 && (
          <>
            <div className="section-title mt-2">{t('recherche.reperes')}</div>
            {reperes.map(l => (
              <Link key={l.id} to={'/guidage/' + l.id} className="card p-2.5 flex gap-3 items-center no-underline text-ink">
                <GlassIcon cat={l.type} size={52} />
                <span className="flex-1 min-w-0"><b className="block truncate">{l.nom}</b><span className="text-[13px] text-muted truncate block">{l.note}</span></span>
              </Link>
            ))}
          </>
        )}
        {q.trim() && (
          <>
            <div className="section-title mt-2">{t('recherche.surCarte')}</div>
            {!carte && !charge && <button type="button" onClick={surCarte} className="btn btn-ghost h-12 text-sm"><SearchIcon size={18} />{t('recherche.chercherCarte', { q })}</button>}
            {charge && <p className="text-[13px] text-muted">{t('recherche.enCours')}</p>}
            {carte && !carte.length && <p className="text-[13px] text-muted">{t('recherche.rien')}</p>}
            {carte?.map(r => (
              <button key={r.id} type="button" onClick={() => allerA(r)} className="card p-2.5 flex gap-3 items-center text-left">
                <GlassIcon cat="Lieu" size={52} />
                <span className="flex-1 min-w-0"><b className="block truncate">{r.nom}</b><span className="text-[13px] text-muted truncate block">{r.adresse || r.type}{moi ? ' · ' + fmtDist(distance(moi, r.pos)) : ''}</span></span>
              </button>
            ))}
            {carte && <p className="text-[11px] text-muted">{t('recherche.osm')}</p>}
          </>
        )}
        {erreur && <p className="text-sm text-red-700" role="alert">{t(erreur)}</p>}
      </div>
    </Screen>
  )
}


export function Boutique() {
  const { id } = useParams()
  const { boutique, moi, favoris, setFavoris, coeursDe, maBoutiqueId, setBoutiques, noterInteret, user, langue, t, tc, zoneDe } = useApp()
  const [art, setArt] = useState(0)
  const b = boutique(id)
  useEffect(() => { if (b) noterInteret(b.categorie) }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const proprio = b && user?.role === 'vendeur' && b.id === maBoutiqueId
  const changerCouverture = async e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    try { const img = await lireImage(f); setBoutiques(bs => bs.map(x => (x.id === b.id ? { ...x, couverture: img } : x))) } catch { /* image illisible */ }
  }
  if (!b) return <Screen nav><TopBar title={t('boutique.introuvable')} back="/carte" /></Screen>
  const fav = favoris.includes(b.id)
  const toggleFav = () => setFavoris(f => (fav ? f.filter(x => x !== b.id) : [...f, b.id]))
  const a = (b.articles || [])[art]
  const tel = (b.telephone || b.whatsapp || '').replace(/\D/g, '')
  const horaires = !b.horaires || b.horaires === 'Horaires non indiqués' ? t('horaires.non') : horairesLisibles(b.horaires, langue, t)
  const atouts = [[t('boutique.verifiee'), I.check, b.verifiee], [t('boutique.gros'), I.shop, true], [t('boutique.momo'), 'M7 2h10v20H7zM11 18h2', true], [t('boutique.ouvert'), 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', true]].filter(x => x[2])
  return (
    <Screen>
      <div className="flex-1 min-h-0 scroll no-scrollbar">
        <div className="relative h-[280px] overflow-hidden rounded-b-[32px] bg-[#EEF8F2]">
          {b.couverture
            ? <><img src={b.couverture} alt={t('boutique.photoDe', { nom: b.nom })} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" /></>
            : null}
          {proprio && (
            <label className="absolute right-4 top-[72px] h-10 px-3.5 rounded-full bg-white/95 shadow flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer">
              <Icon d={I.camera} size={16} />{b.couverture ? t('boutique.changerPhoto') : t('photo.ajouter')}
              <input type="file" accept="image/*" className="sr-only" onChange={changerCouverture} />
            </label>
          )}
          <div className="absolute left-4 right-4 top-4 flex justify-between">
            <BackButton />
            <button type="button" onClick={toggleFav} aria-label={fav ? t('boutique.retirerFavoris') : t('boutique.ajouterFavoris')} aria-pressed={fav}
              className={'h-11 px-3.5 rounded-full flex items-center gap-1.5 text-[13px] font-semibold border ' + (fav ? 'bg-ink border-ink text-white' : 'bg-white border-line text-ink')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={I.heart} /></svg>{fav ? t('boutique.favori') : t('boutique.ajouterFavoris')}
            </button>
          </div>
          <div className="absolute left-5 right-5 bottom-5">
            {b.photo && <img src={b.photo} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow mb-2" />}
            <div className="flex flex-wrap gap-1.5 mb-2.5"><span className="inline-flex items-center h-6 px-2.5 rounded-full bg-white text-[11px] font-bold">{tc(b.categorie)}{moi ? ' · ' + fmtDist(distance(moi, b.pos)) : ''}</span><Coeurs n={coeursDe(b.id).affiches} /></div>
            <h1 className="h-display text-[30px] leading-[1.05]">{b.nom}</h1>
            <div className="text-[13px] text-ink/70 mt-1">{zoneDe(b)} · {horaires}</div>
          </div>
        </div>
        <div className="px-5 pt-6 pb-32 flex flex-col gap-6">
          <div className="grid grid-cols-4 gap-2">
            {atouts.map(([x, d], i) => (
              <div key={x} className="flex flex-col items-center gap-1.5 text-center">
                <span className="tile w-12 h-12 rounded-[16px]" style={{ color: ['#137A52', '#5A3FD6', '#A86A00', '#2457D6'][i % 4] }}><Icon d={d} size={20} /></span>
                <span className="text-[11px] text-muted leading-tight">{x}</span>
              </div>
            ))}
          </div>
          <div className="rounded-[20px] bg-white border border-line p-3.5 flex flex-col gap-2.5">
            <div className="font-semibold text-[14px]">{t('boutique.contacter')}</div>
            {tel ? (
              <div className="flex gap-2">
                <a href={'tel:+' + tel} className="btn btn-ghost flex-1 h-11 text-sm">{t('boutique.appeler')}</a>
                <a href={'https://wa.me/' + tel} className="btn btn-ghost flex-1 h-11 text-sm">WhatsApp</a>
              </div>
            ) : <p className="text-[13px] text-muted">{t('boutique.pasNumero')}</p>}
            {tel && <p className="text-[13px] text-muted">+{tel}</p>}
          </div>
          <VoteCoeur boutiqueId={b.id} />
          <div className="flex items-end justify-between"><h2 className="h-display text-lg">{t('boutique.articles')}</h2><span className="text-xs text-muted">{t('boutique.enVitrine', { n: (b.articles || []).length })}</span></div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {(b.articles || []).map((x, i) => (
              <button key={i} type="button" onClick={() => setArt(i)} aria-pressed={art === i}
                className={'shrink-0 w-[140px] rounded-[22px] p-2 text-left bg-white ' + (art === i ? 'ring-2 ring-brand' : 'border border-line')}>
                <Wax image={x.image} className="h-[96px] rounded-[16px]">
                  {!x.stock && <span className="absolute left-2 top-2 px-2 py-0.5 rounded-full bg-white text-ink text-[10px] font-bold">{t('boutique.rupture')}</span>}
                </Wax>
                <div className="px-1.5 pt-2 pb-1">
                  <div className="text-[13px] font-semibold truncate">{x.nom}</div>
                  <div className="text-[13px] font-bold text-ink">{x.prix ? fmtMoney(x.prix) + ' F' : t('boutique.prixSurPlace')}</div>
                </div>
              </button>
            ))}
          </div>
          {b.repere && (
            <div className="rounded-[20px] bg-[#F5F7F6] p-4 flex gap-3 items-start">
              <span className="w-9 h-9 rounded-full bg-white border border-line text-ink flex items-center justify-center shrink-0"><Icon d={I.pin} size={16} /></span>
              <span className="text-[13px] leading-snug"><b className="block text-[14px]">{t('boutique.commentTrouver')}</b>{b.repere}</span>
            </div>
          )}
        </div>
      </div>
      <div className="absolute left-3 right-3 bottom-3 z-[700] rounded-full bg-white border border-line p-1.5 flex items-center gap-2 shadow-[0_14px_30px_-10px_rgba(23,63,51,.35)]">
        <div className="pl-4 flex-1 text-ink leading-tight min-w-0">
          <div className="text-[11px] text-muted truncate">{a ? a.nom : t('boutique.boutique')}</div>
          <div className="font-bold">{a?.prix ? fmtMoney(a.prix) + ' FCFA' : '—'}</div>
        </div>
        <Link to={'/guidage/' + b.id} className="btn btn-main h-12 pl-5 pr-1.5 no-underline">{t('boutique.emmener')}</Link>
      </div>
    </Screen>
  )
}

export function Guidage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { boutique, moi, dire, arrets, marquerArret, enPause, poursuivre, t, lieuTraduit, zoneDe } = useApp()
  const [demarre, setDemarre] = useState(false)
  const [fini, setFini] = useState(false)
  const [recadrer, setRecadrer] = useState(0)
  const carte = useRef(null)
  const externe = id === 'ext' ? { id: 'ext', nom: params.get('nom') || t('guidage.destination'), note: params.get('note') || '', type: 'Autre', pos: [Number(params.get('lat')), Number(params.get('lng'))] } : null
  const repere = LIEUX_UTILES.find(l => l.id === id)
  const cible = externe || boutique(id) || (repere && lieuTraduit(repere))
  // Itinéraire par les rues (OpenStreetMap). null = plan indisponible → ligne droite.
  const [graphe, setGraphe] = useState(undefined)
  useEffect(() => { let ok = true; chargerGraphe().then(g => ok && setGraphe(g)); return () => { ok = false } }, [])
  const chemin = useMemo(() => (graphe && moi && cible ? plusCourtChemin(graphe, moi, cible.pos) : null),
    [graphe, moi?.[0]?.toFixed(5), moi?.[1]?.toFixed(5), cible?.pos?.[0], cible?.pos?.[1]]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!cible) return <Screen><TopBar title={t('guidage.introuvable')} back="/carte" /></Screen>
  const d = moi ? (chemin ? chemin.distance : distance(moi, cible.pos)) : null
  const arrive = moi !== null && distance(moi, cible.pos) < 10
  const consigne = chemin && prochaineConsigne(chemin.points)
  const titre = d === null ? t('guidage.gps') : arrive ? t('commun.arrive') : fmtDist(d)
  const sous = d === null ? t('guidage.activer')
    : arrive ? t('guidage.justeLa', { nom: cible.nom })
    : consigne ? t('guidage.consigne', { d: fmtDist(consigne.distance), cote: t('cote.' + consigne.cote) })
    : t('guidage.direction', { nom: cible.nom, dir: t('dir.' + directionIndex(bearing(moi, cible.pos))) })
  const infoChemin = graphe === undefined ? t('guidage.chargementPlan')
    : chemin && chemin.parRues > 0 ? t('guidage.parRues') + (chemin.volOiseau > 30 ? t('guidage.volOiseau', { d: fmtDist(chemin.volOiseau) }) : '')
    : graphe ? t('guidage.ligneDroite') : t('guidage.planIndispo')
  // Démarrer un guidage recentre la carte sur le chemin (une fois)
  const demarrer = () => { setDemarre(true); setRecadrer(n => n + 1); dire(titre + '. ' + sous) }
  return (
    <MapShell controle={carte}
      map={<MapView className="absolute inset-0" moi={moi} boutiques={cible.categorie ? [cible] : []} lieux={cible.categorie ? [] : [cible]} selection={cible.id} togglePos="right-3 top-[124px]" arrets={arrets}
        route={chemin ? chemin.points : moi ? [moi, cible.pos] : []} fit={chemin ? chemin.points : moi ? [moi, cible.pos] : [cible.pos]} recadrer={recadrer} controle={carte} />}
      top={<div className="flex gap-2 items-center"><BackButton /><div className="flex-1 min-w-0"><Banner titre={titre} sous={sous} icon={I.go} right={<SonBouton />} /></div></div>}
      bottom={
        <Card className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            {cible.categorie ? <Wax image={cible.couverture} className="w-11 h-11 rounded-[14px] shrink-0" /> : <GlassIcon cat={cible.type} size={44} />}
            <div className="flex-1 min-w-0"><div className="font-bold truncate">{cible.nom}</div><div className="text-[12px] text-muted truncate">{cible.note || (cible.zone && zoneDe(cible))}</div></div>
            {d !== null && <div className="h-display text-lg">{Math.max(1, Math.round(d / 70))} min</div>}
          </div>
          {fini && cible.categorie ? (
            <>
              <VoteCoeur boutiqueId={cible.id} compact />
              <button type="button" onClick={() => nav('/carte')} className="btn btn-main no-arrow h-12 text-sm">{t('guidage.retourCarte')}</button>
            </>
          ) : !demarre ? (
            <button type="button" onClick={demarrer} className="btn btn-main h-[52px]">{t('guidage.demarrer')}</button>
          ) : (
            <>
              <p className="text-[12px] text-muted">{infoChemin}</p>
              {enPause && (
                <div className="rounded-2xl bg-[#E6F4EC] px-3.5 py-3 text-[13px] text-[#0F5440] leading-snug"><b>{t('trajet.arretMarque', { n: arrets.length })}</b> {t('guidage.pause')}</div>
              )}
              {enPause
                ? <button type="button" onClick={() => { poursuivre(); dire(titre + '. ' + sous) }} className="btn bg-brand text-white h-12 text-sm"><Icon d="M8 5l11 7-11 7z" size={18} />{t('guidage.poursuivre')}</button>
                : <button type="button" onClick={marquerArret} className="btn btn-ghost h-12 text-sm"><Icon d={I.pin} size={18} />{t('trajet.marquerArret')}</button>}
              <SonLigne />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setDemarre(false); poursuivre() }} className="btn btn-ghost flex-1 h-12 text-sm">{t('commun.arreter')}</button>
                <button type="button" onClick={() => (cible.categorie ? setFini(true) : nav('/carte'))} className="btn btn-main no-arrow flex-1 h-12 text-sm">{t('guidage.arrive')}</button>
              </div>
            </>
          )}
        </Card>
      }
    />
  )
}
