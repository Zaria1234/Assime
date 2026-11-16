// Écran de découverte : montré à chaque arrivée sans être connecté.
// 6 slides qu'on fait défiler au doigt, puis la slide d'accueil (langue, continuer sans compte).
// « Créer un compte » et « J'ai déjà un compte » restent en bas de toutes les slides.
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Screen, Icon, I } from '../components/ui'

// Dessins sobres : gris très clair, traits fins, un seul accent vert
const VERT = '#176B52', GRIS = '#F2F2F4', GRIS2 = '#E6E6EA', TRAIT = '#C9C9D1'
const LANGUES = [{ id: 'ewe', nom: 'Éwé' }, { id: 'mina', nom: 'Mina' }, { id: 'fr', nom: 'Français' }]

const Dessin = ({ children }) => (
  <svg viewBox="0 0 320 220" className="w-full h-full max-w-[320px]" aria-hidden="true">{children}</svg>
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
  <Dessin>
    <Pates />
    <Repere x={160} y={132} />
  </Dessin>
)
const IlluChemin = () => (
  <Dessin>
    <Pates />
    <path d="M110 206V110H210V44" fill="none" stroke={VERT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="110" cy="206" r="7" fill="#fff" stroke="#9A9AA5" strokeWidth="2" />
    <circle cx="210" cy="44" r="9" fill={VERT} stroke="#fff" strokeWidth="3" />
  </Dessin>
)
const IlluRecherche = () => (
  <Dessin>
    <rect x="30" y="20" width="260" height="40" rx="20" fill={GRIS} />
    <circle cx="54" cy="39" r="7" fill="none" stroke="#9A9AA5" strokeWidth="1.5" />
    <path d="M59 44l5 5" stroke="#9A9AA5" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="74" y="36" width="80" height="7" rx="3.5" fill={GRIS2} />
    {[78, 128, 178].map((y, i) => (
      <g key={y}>
        <rect x="30" y={y} width="260" height="40" rx="12" fill={i ? GRIS : '#fff'} stroke={i ? 'none' : VERT} strokeWidth="2" />
        <circle cx="54" cy={y + 20} r="10" fill={GRIS2} />
        <rect x="76" y={y + 11} width={[120, 96, 110][i]} height="7" rx="3.5" fill={GRIS2} />
        <rect x="76" y={y + 23} width={[70, 80, 56][i]} height="6" rx="3" fill={GRIS2} />
      </g>
    ))}
  </Dessin>
)
const IlluVoix = () => (
  <Dessin>
    <path d="M52 14h130a20 20 0 0 1 20 20v18a20 20 0 0 1-20 20H62l-18 12 4-18a20 20 0 0 1-16-20V34a20 20 0 0 1 20-20z" fill={GRIS} />
    <rect x="56" y="33" width="118" height="7" rx="3.5" fill={GRIS2} />
    <rect x="56" y="47" width="76" height="7" rx="3.5" fill={GRIS2} />
    <rect x="128" y="96" width="162" height="46" rx="18" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
    <rect x="148" y="116" width="104" height="7" rx="3.5" fill={GRIS2} />
    <circle cx="160" cy="184" r="28" fill={VERT} />
    <rect x="154" y="169" width="12" height="20" rx="6" fill="#fff" />
    <path d="M148 184a12 12 0 0 0 24 0M160 196v6" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
  </Dessin>
)
const IlluListe = () => (
  <Dessin>
    <rect x="40" y="14" width="240" height="148" rx="18" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
    {[44, 88, 132].map((y, i) => (
      <g key={y}>
        {i === 0
          ? <><circle cx="68" cy={y} r="10" fill={VERT} /><path d={`M63 ${y}l4 4 7-8`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>
          : <circle cx="68" cy={y} r="9.25" fill="none" stroke={TRAIT} strokeWidth="1.5" />}
        <rect x="90" y={y - 4} width={[110, 130, 84][i]} height="8" rx="4" fill={GRIS2} />
      </g>
    ))}
    <rect x="40" y="184" width="240" height="12" rx="6" fill={GRIS2} />
    <rect x="40" y="184" width="96" height="12" rx="6" fill={VERT} />
  </Dessin>
)
const IlluVitrine = () => (
  <Dessin>
    <Repere x={160} y={70} />
    <rect x="92" y="112" width="136" height="88" rx="6" fill={GRIS} />
    <path d="M84 92h152l10 26a6 6 0 0 1-6 8H80a6 6 0 0 1-6-8z" fill={GRIS2} />
    <rect x="146" y="150" width="28" height="50" rx="4" fill="#fff" stroke={TRAIT} strokeWidth="1.5" />
    <path d="M60 200h200" stroke={TRAIT} strokeWidth="1.5" strokeLinecap="round" />
  </Dessin>
)
const IlluAccueil = () => (
  <Dessin>
    <circle cx="160" cy="110" r="92" fill={GRIS} />
    <circle cx="160" cy="110" r="62" fill={GRIS2} />
    <Repere x={160} y={146} />
  </Dessin>
)

// « : » et « ? » gardent leur espace insécable pour ne jamais se retrouver seuls en début de ligne
const SLIDES = [
  { titre: 'Bienvenue à Asigamé', texte: "Assimé t'aide à te repérer dans le Grand Marché, dans ta langue.", Illu: IlluMarche },
  { titre: 'Va où tu veux', texte: "Une boutique, la sortie, ta moto : l'app te guide d'un point à un autre.", Illu: IlluChemin },
  { titre: 'Trouve la bonne boutique', texte: "Cherche un article, compare, et laisse-toi guider jusqu'au stand.", Illu: IlluRecherche },
  { titre: "Parle à l'IA", texte: 'Dis ce que tu cherches : elle trouve, compare et te montre le chemin.', Illu: IlluVoix },
  { titre: 'Ta liste, ton budget', texte: "Coche tes achats à la voix, l'app calcule ce qu'il te reste.", Illu: IlluListe },
  { titre: 'Tu vends au marché ?', texte: 'Place ta boutique sur la carte pour que les clients te trouvent.', Illu: IlluVitrine },
]

/** Dernière slide : l'ancien écran Bienvenue (langue, continuer sans compte) */
function Accueil() {
  const { langue, setLangue, continuerSansCompte } = useApp()
  return (
    <>
      <h1 className="h-display text-[32px] leading-[1.08]">Ne te perds plus à <span className="text-brand">Asigamé.</span></h1>
      <p className="text-[15px] text-muted leading-relaxed mt-2.5">Retrouve ta moto, trouve ta boutique, gère ton budget. Guidé·e dans ta langue.</p>
      <div className="grid grid-cols-3 gap-2 mt-4" role="group" aria-label="Langue">
        {LANGUES.map(l => (
          <button key={l.id} type="button" onClick={() => setLangue(l.id)} aria-pressed={langue === l.id}
            className={'h-11 rounded-full text-[14px] font-semibold ' + (langue === l.id ? 'bg-white text-brand border-2 border-brand' : 'bg-white text-ink border border-field')}>
            {l.nom}
          </button>
        ))}
      </div>
      <Link to="/carte" onClick={continuerSansCompte} className="block text-center text-[15px] text-[#3A3F4B] underline underline-offset-4 font-semibold py-3 mt-1">Continuer sans compte</Link>
    </>
  )
}

export default function Decouverte() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { user } = useApp()
  // Déjà connecté (venu de Profil → « Découvrir Assimé ») : les 6 slides seulement, sans les boutons de compte
  const connecte = !!user?.verifie
  const N = connecte ? SLIDES.length : SLIDES.length + 1
  const [index, setIndex] = useState(0)
  const [glisse, setGlisse] = useState(0) // déplacement du doigt en cours, en pixels
  const depart = useRef(null)
  const aGlisse = useRef(false)
  const dernier = index === N - 1
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
  }
  // Un swipe commencé sur un bouton (langue…) ne doit pas l'activer
  const clicApresSwipe = e => {
    if (!aGlisse.current) return
    aGlisse.current = false
    e.preventDefault(); e.stopPropagation()
  }

  const slides = connecte ? SLIDES : [...SLIDES, { titre: 'Ne te perds plus à Asigamé', Illu: IlluAccueil, accueil: true }]

  return (
    <Screen fond="#FFFFFF">
      <div className="flex-1 min-h-0 flex flex-col">
        <header className="flex items-center gap-2.5 px-6 pt-5 pb-1">
          <div className="w-10 h-10 rounded-[14px] bg-brand flex items-center justify-center">
            <Icon size={22} stroke="#fff" width={2.4}><path d={I.pin} /><circle cx="12" cy="9" r="2.5" /></Icon>
          </div>
          <span className="h-display text-xl flex-1">Assimé</span>
          <button type="button" onClick={() => aller(N - 1)} aria-label="Passer : aller à la dernière slide"
            className={'h-11 px-3 -mr-3 rounded-full text-[15px] font-semibold text-[#3A3F4B] ' + (dernier ? 'invisible' : '')}>
            Passer
          </button>
        </header>

        <section aria-roledescription="carrousel" aria-label="Découvrir Assimé"
          className="relative flex-1 min-h-0 overflow-hidden select-none" style={{ touchAction: 'pan-y' }}
          onPointerDown={debut} onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin} onPointerLeave={fin} onClickCapture={clicApresSwipe}>
          <div className={'flex h-full ' + (glisse ? '' : 'dec-piste')} aria-live="polite"
            style={{ transform: `translateX(calc(${-index * 100}% + ${glisse}px))` }}>
            {slides.map(({ titre, texte, Illu, accueil }, i) => {
              const actif = i === index
              return (
                <div key={titre} role="group" aria-roledescription="slide" aria-label={`${i + 1} sur ${N}`} aria-hidden={!actif} inert={!actif}
                  className="w-full h-full shrink-0 px-6">
                  <div key={actif ? 'vue' : 'attente'} className={'h-full flex flex-col ' + (actif ? 'dec-in' : '')}>
                    <div className="flex-1 min-h-0 flex items-center justify-center py-4"><Illu /></div>
                    <div className={'shrink-0 ' + (accueil ? '' : 'min-h-[148px]')}>
                      {accueil ? <Accueil /> : (
                        <>
                          <h1 className="h-display text-[28px] leading-[1.12]">{titre}</h1>
                          <p className="text-[15px] text-muted leading-relaxed mt-2.5">{texte}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <footer className="px-6 pt-1 pb-5">
          <div className="flex items-center justify-center" role="group" aria-label="Progression">
            {slides.map((s, i) => (
              <button key={s.titre} type="button" onClick={() => aller(i)} aria-label={`Slide ${i + 1} sur ${N} : ${s.titre}`}
                aria-current={i === index ? 'step' : undefined} className="h-8 px-1 flex items-center">
                <span className={'block h-2 rounded-full transition-all duration-300 ' + (i === index ? 'w-6 bg-brand' : 'w-2 bg-[#C9C9D1]')} />
              </button>
            ))}
          </div>
          {connecte ? (
            <button type="button" onClick={() => nav(state?.retour || '/', { replace: true })} className="btn btn-main w-full h-[52px] mt-2">Fermer</button>
          ) : (
            <>
              <Link to="/inscription" className="btn btn-main w-full h-[52px] mt-2">Créer un compte</Link>
              <Link to="/connexion" className="flex items-center justify-center h-11 mt-1 text-[15px] font-semibold text-ink underline underline-offset-4">J'ai déjà un compte</Link>
            </>
          )}
        </footer>
      </div>
    </Screen>
  )
}
