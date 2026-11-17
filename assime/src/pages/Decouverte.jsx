// Écran de découverte : montré à chaque arrivée sans être connecté.
// 6 slides sobres qu'on fait défiler au doigt, puis la page d'accueil « Ne te perds plus à Asigamé. »
// (Bienvenue, dans Entree.jsx) avec son propre design et ses propres boutons.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Screen, Icon, I } from '../components/ui'
import { GlassIcon } from '../components/art'
import { Bienvenue } from './Entree'
import { LANGUES } from '../i18n'

// « Va où tu veux » : dessin seul (chemin vert, départ et arrivée), sans icône.
// Dessins sobres : gris très clair, traits fins, chemin vert ; les icônes sont des tuiles GlassIcon posées dessus
const VERT = '#176B52', GRIS = '#F2F2F4', GRIS2 = '#E6E6EA', TRAIT = '#C9C9D1'
const L = 320, H = 220 // boîte de dessin, mise à l'échelle de l'écran

const Dessin = ({ children }) => (
  <svg viewBox={`0 0 ${L} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">{children}</svg>
)
/** Tuile blanche avec l'icône colorée de la catégorie, centrée sur (x, y) */
const Tuile = ({ x, y, cat, size = 40 }) => (
  <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}><GlassIcon cat={cat} size={size} /></div>
)
/** Repère vert, pointe en (x, y) */
const Repere = ({ x, y }) => (
  <>
    <path d={`M${x} ${y}c-14-13-22-24-22-36a22 22 0 0 1 44 0c0 12-8 23-22 36z`} fill={VERT} />
    <circle cx={x} cy={y - 36} r="8" fill="#fff" />
  </>
)
/** Pâtés de boutiques du marché, séparés par des allées */
const Pates = () => (
  <g fill={GRIS}>
    {[30, 120].map(y => [20, 120, 220].map(x => <rect key={x + '-' + y} x={x} y={y} width="80" height="70" rx="12" />))}
  </g>
)

const IlluMarche = () => (
  <>
    <Dessin><Pates /><Repere x={160} y={132} /></Dessin>
    <Tuile x={60} y={65} cat="Pagnes wax" />
    <Tuile x={260} y={65} cat="Épices" />
    <Tuile x={260} y={155} cat="Banque" />
  </>
)
const IlluChemin = () => (
  <>
    <Dessin>
      <Pates />
      <path d="M110 206V110H210V44" fill="none" stroke={VERT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="110" cy="206" r="7" fill="#fff" stroke="#9A9AA5" strokeWidth="2" />
      <circle cx="210" cy="44" r="9" fill={VERT} stroke="#fff" strokeWidth="3" />
    </Dessin>
  </>
)
const IlluRecherche = () => (
  <>
    <Dessin>
      <rect x="30" y="20" width="260" height="40" rx="20" fill={GRIS} />
      <circle cx="54" cy="39" r="7" fill="none" stroke="#9A9AA5" strokeWidth="1.5" />
      <path d="M59 44l5 5" stroke="#9A9AA5" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="74" y="36" width="80" height="7" rx="3.5" fill={GRIS2} />
      {[78, 128, 178].map((y, i) => (
        <g key={y}>
          <rect x="30" y={y} width="260" height="40" rx="12" fill={i ? GRIS : '#fff'} stroke={i ? 'none' : VERT} strokeWidth="2" />
          <rect x="80" y={y + 11} width={[120, 96, 110][i]} height="7" rx="3.5" fill={GRIS2} />
          <rect x="80" y={y + 23} width={[70, 80, 56][i]} height="6" rx="3" fill={GRIS2} />
        </g>
      ))}
    </Dessin>
    <Tuile x={54} y={98} cat="Pagnes wax" size={30} />
    <Tuile x={54} y={148} cat="Chaussures" size={30} />
    <Tuile x={54} y={198} cat="Sacs" size={30} />
  </>
)
const IlluVoix = () => (
  <>
    <Dessin>
      <path d="M52 14h130a20 20 0 0 1 20 20v18a20 20 0 0 1-20 20H62l-18 12 4-18a20 20 0 0 1-16-20V34a20 20 0 0 1 20-20z" fill={GRIS} />
      <rect x="56" y="33" width="118" height="7" rx="3.5" fill={GRIS2} />
      <rect x="56" y="47" width="76" height="7" rx="3.5" fill={GRIS2} />
      <rect x="128" y="96" width="162" height="46" rx="18" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
      <rect x="176" y="111" width="92" height="7" rx="3.5" fill={GRIS2} />
      <rect x="176" y="123" width="60" height="6" rx="3" fill={GRIS2} />
      <circle cx="160" cy="184" r="34" fill="none" stroke={VERT} strokeWidth="1.5" opacity=".35" />
    </Dessin>
    <Tuile x={152} y={119} cat="Épices" size={30} />
    <Tuile x={160} y={184} cat="Micro" size={52} />
  </>
)
const IlluListe = () => (
  <>
    <Dessin>
      <rect x="40" y="14" width="240" height="148" rx="18" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
      {[44, 88, 132].map((y, i) => (
        <g key={y}>
          {i === 0
            ? <><circle cx="68" cy={y} r="10" fill={VERT} /><path d={`M63 ${y}l4 4 7-8`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>
            : <circle cx="68" cy={y} r="9.25" fill="none" stroke={TRAIT} strokeWidth="1.5" />}
          <rect x="90" y={y - 4} width={[96, 110, 84][i]} height="8" rx="4" fill={GRIS2} />
        </g>
      ))}
      <rect x="40" y="184" width="240" height="12" rx="6" fill={GRIS2} />
      <rect x="40" y="184" width="96" height="12" rx="6" fill={VERT} />
    </Dessin>
    <Tuile x={278} y={20} cat="Liste" size={44} />
    <Tuile x={244} y={56} cat="Chaussures" size={30} />
    <Tuile x={244} y={110} cat="Pagnes wax" size={30} />
  </>
)
const IlluVitrine = () => (
  <>
    <Dessin>
      <Repere x={160} y={70} />
      <rect x="92" y="112" width="136" height="88" rx="6" fill={GRIS} />
      <path d="M84 92h152l10 26a6 6 0 0 1-6 8H80a6 6 0 0 1-6-8z" fill={GRIS2} />
      <rect x="146" y="152" width="28" height="48" rx="4" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
      <path d="M60 200h200" stroke={TRAIT} strokeWidth="1.5" strokeLinecap="round" />
    </Dessin>
    <Tuile x={52} y={170} cat="Tout" size={44} />
    <Tuile x={119} y={164} cat="Pagnes wax" size={32} />
    <Tuile x={201} y={164} cat="Sacs" size={32} />
  </>
)

// « : » et « ? » gardent leur espace insécable pour ne jamais se retrouver seuls en début de ligne
// Textes dans src/i18n.js : decouverte.s1.titre, decouverte.s1.texte…
const SLIDES = [IlluMarche, IlluChemin, IlluRecherche, IlluVoix, IlluListe, IlluVitrine].map((Illu, i) => ({ id: 's' + (i + 1), Illu }))
const ACCUEIL = { id: 'accueil', accueil: true }

export default function Decouverte() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { user, t, langue, setLangue } = useApp()
  // Déjà connecté (venu de Profil → « Découvrir Assimé ») : les 6 slides seulement, sans les boutons de compte
  const connecte = !!user?.verifie
  const slides = (connecte ? SLIDES : [...SLIDES, ACCUEIL]).map(x => (x.accueil ? { ...x, titre: t('accueil.avant') + ' ' + t('accueil.mot') + ' ' + t('accueil.apres') + ' Asigamé' } : { ...x, titre: t('decouverte.' + x.id + '.titre'), texte: t('decouverte.' + x.id + '.texte') }))
  const N = slides.length
  const [index, setIndex] = useState(0)
  const [glisse, setGlisse] = useState(0) // déplacement du doigt en cours, en pixels
  const [echelle, setEchelle] = useState(1)
  const zone = useRef(null)
  const depart = useRef(null)
  const aGlisse = useRef(false)
  const dernier = index === N - 1
  const surAccueil = !!slides[index].accueil // la page d'accueil a ses propres logo et boutons
  const aller = i => setIndex(Math.max(0, Math.min(N - 1, i)))

  // Flèches du clavier
  useEffect(() => {
    const touche = e => {
      if (e.key === 'ArrowRight') setIndex(i => Math.min(N - 1, i + 1))
      else if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
      else if (e.key === 'Home') setIndex(0)
      else if (e.key === 'End') setIndex(N - 1)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [N])

  // Le dessin prend la place libre entre l'en-tête, le texte et les boutons du bas
  useLayoutEffect(() => {
    const el = zone.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setEchelle(Math.max(0.55, Math.min(1.1, (width - 48) / L, (height - 436) / H)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Swipe gauche/droite (doigt ou souris) ; un geste vertical est ignoré
  const debut = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    aGlisse.current = false
    depart.current = { x: e.clientX, y: e.clientY, axe: null }
  }
  const bouge = e => {
    const d = depart.current
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (!d.axe) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { d.axe = 'x'; aGlisse.current = true }
      else if (Math.abs(dy) > 8) { depart.current = null; return }
      else return
    }
    const auBord = (index === 0 && dx > 0) || (dernier && dx < 0)
    setGlisse(auBord ? dx / 3 : dx)
  }
  const fin = e => {
    const d = depart.current
    depart.current = null
    if (d?.axe === 'x' && e.type === 'pointerup') {
      const dx = e.clientX - d.x
      if (dx < -50) aller(index + 1)
      else if (dx > 50) aller(index - 1)
    }
    setGlisse(0)
    setTimeout(() => { aGlisse.current = false }, 0) // seul le clic du geste en cours est ignoré
  }
  // Un swipe commencé sur un bouton (langue, compte…) ne doit pas l'activer
  const clicApresSwipe = e => {
    if (!aGlisse.current) return
    aGlisse.current = false
    e.preventDefault(); e.stopPropagation()
  }

  return (
    <Screen fond="#FFFFFF">
      <div className="flex-1 min-h-0 relative">
        <section ref={zone} aria-roledescription="carrousel" aria-label={t('decouverte.aria')}
          className="absolute inset-0 overflow-hidden select-none" style={{ touchAction: 'pan-y' }}
          onPointerDown={debut} onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin} onPointerLeave={fin} onClickCapture={clicApresSwipe}>
          <div className={'flex h-full ' + (glisse ? '' : 'dec-piste')} aria-live="polite"
            style={{ transform: `translateX(calc(${-index * 100}% + ${glisse}px))` }}>
            {slides.map(({ id, titre, texte, Illu, accueil }, i) => {
              const actif = i === index
              return (
                <div key={id} role="group" aria-roledescription="slide" aria-label={t('decouverte.slide', { i: i + 1, n: N })} aria-hidden={!actif} inert={!actif}
                  className="w-full h-full shrink-0">
                  {accueil ? <div className="h-full flex flex-col bg-white"><Bienvenue /></div> : (
                    // l'en-tête (68 px) et les boutons du bas (168 px) sont posés par-dessus
                    <div key={actif ? 'vue' : 'attente'} className={'h-full flex flex-col px-6 pt-[68px] pb-[168px] ' + (actif ? 'dec-in' : '')}>
                      <div className="flex-1 min-h-0 flex items-center justify-center">
                        <div style={{ width: L * echelle, height: H * echelle }}>
                          <div className="relative origin-top-left" style={{ width: L, height: H, transform: `scale(${echelle})` }}><Illu /></div>
                        </div>
                      </div>
                      <div className="shrink-0 min-h-[148px]">
                        <h1 className="h-display text-[28px] leading-[1.12]">{titre}</h1>
                        <p className="text-[15px] text-muted leading-relaxed mt-2.5">{texte}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {!surAccueil && (
          <>
            <header className="absolute inset-x-0 top-0 flex items-center gap-2.5 px-6 pt-5 pb-1 pointer-events-none">
              <div className="w-10 h-10 rounded-[14px] bg-brand flex items-center justify-center">
                <Icon size={22} stroke="#fff" width={2.4}><path d={I.pin} /><circle cx="12" cy="9" r="2.5" /></Icon>
              </div>
              <span className="h-display text-xl flex-1 min-w-0 truncate max-[379px]:sr-only">Assimé</span>
              <span className="max-[379px]:flex-1" />
              {/* Langue : tout l'écran change tout de suite */}
              <div role="group" aria-label={t('commun.langue')} className="flex rounded-full bg-[#F2F2F4] p-0.5 pointer-events-auto">
                {LANGUES.map(l => (
                  <button key={l.id} type="button" onClick={() => setLangue(l.id)} aria-pressed={langue === l.id} aria-label={l.nom} lang={l.id === 'ewe' ? 'ee' : l.id}
                    className={'h-9 px-2.5 rounded-full text-[12px] font-bold ' + (langue === l.id ? 'bg-white text-brand shadow-sm' : 'text-[#5B605C]')}>{l.court}</button>
                ))}
              </div>
              <button type="button" onClick={() => aller(N - 1)} aria-label={t('decouverte.passerAria')}
                className={'h-11 px-3 -mr-3 rounded-full text-[15px] font-semibold text-[#3A3F4B] pointer-events-auto ' + (dernier ? 'invisible' : '')}>
                {t('decouverte.passer')}
              </button>
            </header>

            <footer className="absolute inset-x-0 bottom-0 px-6 pt-1 pb-5 pointer-events-none">
              <div className="flex items-center justify-center pointer-events-auto" role="group" aria-label={t('decouverte.progression')}>
                {slides.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => aller(i)} aria-label={t('decouverte.etape', { i: i + 1, n: N, titre: s.titre })}
                    aria-current={i === index ? 'step' : undefined} className="h-8 px-1 flex items-center">
                    <span className={'block h-2 rounded-full transition-all duration-300 ' + (i === index ? 'w-6 bg-brand' : 'w-2 bg-[#C9C9D1]')} />
                  </button>
                ))}
              </div>
              <div className="pointer-events-auto">
                {connecte ? (
                  <button type="button" onClick={() => nav(state?.retour || '/', { replace: true })} className="btn btn-main w-full h-[52px] mt-2">{t('commun.fermer')}</button>
                ) : (
                  <>
                    <Link to="/inscription" className="btn btn-main w-full h-[52px] mt-2">{t('decouverte.creer')}</Link>
                    <Link to="/connexion" className="flex items-center justify-center h-11 mt-1 text-[15px] font-semibold text-ink underline underline-offset-4">{t('decouverte.deja')}</Link>
                  </>
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </Screen>
  )
}
