// Écran de découverte : 6 slides montrées à la première ouverture, avant Bienvenue.
// On peut les revoir depuis Profil → « Découvrir Assimé ».
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ThumbsUpIcon, MicrophoneIcon, WhatsappLogoIcon, CheckIcon, MagnifyingGlassIcon, CameraIcon,
  TranslateIcon, MapPinIcon, SparkleIcon, PersonSimpleWalkIcon,
} from '@phosphor-icons/react'
import { useApp } from '../store'
import { Screen, Icon, I } from '../components/ui'
import { GlassIcon, Emoji, Ring, teinte } from '../components/art'

const CLE = 'assime_decouverte_vue'
export const decouverteVue = () => { try { return localStorage.getItem(CLE) === '1' } catch { return true } }
const marquerVue = () => { try { localStorage.setItem(CLE, '1') } catch { /* stockage indisponible */ } }

const VERT = '#176B52', ORANGE = '#F5A623', VIOLET = '#7B61F0', VIOLET_FONCE = '#4B36C4', CREME = '#FFF6E5'
// Les illustrations sont dessinées dans une boîte de 342 × 241, puis mises à l'échelle de l'écran
const L = 342, H = 241

/** Élément posé sur l'illustration, centré sur (x, y) */
const Pose = ({ x, y, children }) => (
  <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>{children}</div>
)
const Pastille = ({ children, className = 'bg-white text-ink shadow' }) => (
  <span className={'inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-bold whitespace-nowrap ' + className}>{children}</span>
)
const Pouces = ({ n }) => (
  <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-[#F1EEFF] text-[11px] font-bold shrink-0" style={{ color: VIOLET_FONCE }}>
    <ThumbsUpIcon size={13} weight="fill" color={VIOLET} aria-hidden="true" />{n}
  </span>
)

/** Mini-carte du marché : pâtés de boutiques séparés par des allées */
function Plan({ children }) {
  const colonnes = [[12, 72], [102, 59], [179, 59], [256, 74]]
  const rangees = [[12, 61], [91, 60], [169, 60]]
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect width={L} height={H} fill="#F4F1E6" />
      <g fill="#E2E8DF">
        {rangees.map(([y, h]) => colonnes.map(([x, w]) => <rect key={x + '-' + y} x={x} y={y} width={w} height={h} rx="10" />))}
      </g>
      {children}
    </svg>
  )
}

function IlluBienvenue() {
  return (
    <>
      <Plan>
        <path d="M93 212 V160 H170 V82 H247 V46" fill="none" stroke={VERT} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 10" />
        <circle cx="93" cy="212" r="9" fill={ORANGE} stroke="#fff" strokeWidth="3" />
        <circle cx="247" cy="46" r="11" fill={VERT} stroke="#fff" strokeWidth="4" />
      </Plan>
      <Pose x={48} y={42}><GlassIcon cat="Pagnes wax" size={44} /></Pose>
      <Pose x={131} y={121}><GlassIcon cat="Épices" size={44} /></Pose>
      <Pose x={293} y={121}><GlassIcon cat="Chaussures" size={44} /></Pose>
      <Pose x={44} y={212}><Pastille className="bg-sun text-ink">Ma moto</Pastille></Pose>
      <Pose x={250} y={200}><Pastille><TranslateIcon size={14} weight="bold" color={VERT} aria-hidden="true" />Éwé · Mina · Français</Pastille></Pose>
    </>
  )
}

function IlluMoto() {
  return (
    <>
      <Plan>
        {/* le chemin de l'aller, enregistré, puis le retour au plus court */}
        <path d="M170 40 V82 H93 V160 H170 V206" fill="none" stroke="#9AA39D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 9" />
        <path d="M170 40 V206" fill="none" stroke={VERT} strokeWidth="5" strokeLinecap="round" />
        <circle cx="170" cy="40" r="17" fill={VERT} opacity=".18" />
        <circle cx="170" cy="40" r="9" fill={VERT} stroke="#fff" strokeWidth="3" />
        <circle cx="170" cy="206" r="10" fill={ORANGE} stroke="#fff" strokeWidth="3" />
      </Plan>
      <Pose x={205} y={40}><Pastille>Toi</Pastille></Pose>
      <Pose x={48} y={121}><Pastille className="bg-white/90 text-[#4B5160]">Ton chemin</Pastille></Pose>
      <Pose x={284} y={121}><Pastille><PersonSimpleWalkIcon size={14} weight="bold" color={VERT} aria-hidden="true" />3 min à pied</Pastille></Pose>
      <Pose x={126} y={199}><GlassIcon cat="Parking" size={48} /></Pose>
      <Pose x={222} y={206}><Pastille className="bg-sun text-ink">Ma moto</Pastille></Pose>
    </>
  )
}

/** Fond crème avec deux halos doux, pour les illustrations sans carte */
function Fond({ children }) {
  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect width={L} height={H} fill={CREME} />
      <circle cx="300" cy="24" r="90" fill={VERT} opacity=".08" />
      <circle cx="30" cy="226" r="80" fill={ORANGE} opacity=".14" />
      {children}
    </svg>
  )
}

function IlluBoutiques() {
  const boutiques = [
    ['Pagnes wax', 'Boutique de pagnes', 'Allée des tissus · 2 min', 24],
    ['Tissus', 'Tissus et bazin', 'Près de la cathédrale · 4 min', 17],
    ['Perles et bijoux', 'Pagnes et perles', 'Entrée nord · 5 min', 9],
  ]
  return (
    <>
      <Fond />
      <div className="absolute inset-0 p-3.5 flex flex-col gap-2">
        <div className="h-9 rounded-full bg-white border border-line px-3.5 flex items-center gap-2 text-[13px] font-semibold">
          <MagnifyingGlassIcon size={16} weight="bold" color={VERT} aria-hidden="true" />pagnes
        </div>
        {boutiques.map(([cat, nom, lieu, n], i) => (
          <div key={nom} className={'h-12 rounded-2xl bg-white px-2 flex items-center gap-2.5 ' + (i ? 'border border-line' : 'border-2 border-brand')}>
            <GlassIcon cat={cat} size={36} />
            <span className="flex-1 min-w-0">
              <b className="block text-[13px] leading-tight truncate">{nom}</b>
              <span className="block text-[11px] text-[#4B5160] truncate">{lieu}</span>
            </span>
            <Pouces n={n} />
          </div>
        ))}
      </div>
    </>
  )
}

function IlluIA() {
  return (
    <>
      <Fond>
        <circle cx="292" cy="195" r="36" fill="none" stroke={VERT} strokeWidth="2" opacity=".35" />
        <circle cx="292" cy="195" r="45" fill="none" stroke={VERT} strokeWidth="2" opacity=".16" />
      </Fond>
      <div className="absolute right-3.5 top-3.5 max-w-[212px] bg-brand text-white text-[13px] font-semibold leading-snug px-3.5 py-2.5 rounded-[18px] rounded-br-md">
        Je cherche du riz en gros pas cher
      </div>
      <div className="absolute left-3.5 top-[86px] w-[240px] bg-white border border-line rounded-[18px] rounded-bl-md p-2.5 shadow-[0_10px_24px_-16px_rgba(22,24,29,.4)]">
        <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: VIOLET_FONCE }}>
          <SparkleIcon size={13} weight="fill" color={VIOLET} aria-hidden="true" />IA Assimé
        </div>
        <div className="flex items-center gap-2.5 mt-1.5">
          <GlassIcon cat="Grossistes" size={36} />
          <span className="flex-1 min-w-0">
            <b className="block text-[13px] leading-tight">Riz en gros</b>
            <span className="block text-[11px] text-[#4B5160] whitespace-nowrap">Le moins cher · 3 min</span>
          </span>
          <span className="h-6 px-2.5 rounded-full bg-sun text-ink text-[11px] font-bold flex items-center">Y aller</span>
        </div>
      </div>
      <Pose x={292} y={195}>
        <span className="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-[0_10px_22px_-8px_rgba(23,107,82,.9)]">
          <MicrophoneIcon size={26} weight="fill" color="#fff" aria-hidden="true" />
        </span>
      </Pose>
    </>
  )
}

function IlluListe() {
  const articles = [['Chaussures', '8 000', true], ['Pagne', '', false], ['Riz', '', false]]
  return (
    <>
      <Fond />
      <div className="absolute inset-0 p-3.5 flex items-center gap-3.5">
        <div className="flex-1 min-w-0 bg-white border border-line rounded-[20px] p-3 shadow-[0_10px_24px_-16px_rgba(22,24,29,.4)]">
          <div className="h-display text-[14px] mb-1">Ma liste</div>
          {articles.map(([nom, prix, fait]) => (
            <div key={nom} className="h-9 flex items-center gap-2 text-[13px] border-t border-line">
              <span className={'w-5 h-5 rounded-full flex items-center justify-center shrink-0 ' + (fait ? 'bg-brand' : 'border-2 border-field')}>
                {fait && <CheckIcon size={12} weight="bold" color="#fff" aria-hidden="true" />}
              </span>
              <span className={'flex-1 font-semibold ' + (fait ? 'line-through text-[#4B5160]' : '')}>{nom}</span>
              {prix && <b>{prix}</b>}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <Ring pct={40} size={112} stroke={11} color={ORANGE} track="rgba(22,24,29,.09)">
            <b className="h-display text-[18px] leading-none">12 000</b>
            <span className="text-[10.5px] font-semibold text-[#4B5160] mt-1">F restants</span>
          </Ring>
          <Pastille>Budget 20 000 F</Pastille>
        </div>
      </div>
    </>
  )
}

function IlluVendeur() {
  return (
    <>
      <svg viewBox={`0 0 ${L} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
        <rect width={L} height={H} fill="#FFFDF8" />
        {/* auvent rayé de la vitrine */}
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${i * 38} 0 h38 v24 a19 19 0 0 1 -38 0 z`} fill={i % 2 ? '#FFEBC2' : VERT} />
        ))}
        <rect width={L} height="6" fill="#0F4F3C" />
      </svg>
      <div className="absolute inset-x-4 top-[58px] flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <GlassIcon cat="Tout" size={40} />
          <span className="flex-1 min-w-0">
            <b className="h-display block text-[15px] leading-tight">Ma boutique</b>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4B5160]">
              <MapPinIcon size={12} weight="fill" color={VERT} aria-hidden="true" />Placée sur la carte
            </span>
          </span>
          <Pouces n={12} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Pagnes wax', 'Sacs'].map(cat => (
            <span key={cat} className="tile h-[58px] rounded-2xl"><Emoji cat={cat} size={28} color={teinte(cat)[1]} /></span>
          ))}
          <span className="h-[58px] rounded-2xl border-2 border-dashed border-[#D9A441] bg-white/70 flex items-center justify-center gap-1 text-[11px] font-bold text-[#8A5600]">
            <CameraIcon size={18} weight="duotone" aria-hidden="true" />Photo
          </span>
        </div>
        <span className="h-9 rounded-full bg-brand text-white text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-[0_10px_22px_-12px_rgba(23,107,82,.9)]">
          <WhatsappLogoIcon size={18} weight="fill" aria-hidden="true" />WhatsApp
        </span>
      </div>
    </>
  )
}

// « », : et ? gardent leur espace insécable pour ne jamais se retrouver seuls en début de ligne
const SLIDES = [
  { titre: 'Bienvenue à Asigamé', texte: 'Assimé te guide dans le Grand Marché, dans ta langue.', Illu: IlluBienvenue },
  { titre: 'Ne perds plus ta moto', texte: "Enregistre ton chemin en arrivant. L'app te ramène par le plus court.", Illu: IlluMoto },
  { titre: 'Trouve la bonne boutique', texte: "Cherche, explore, puis laisse-toi guider jusqu'au stand. Les coups de cœur t'aident à choisir.", Illu: IlluBoutiques },
  { titre: "Parle à l'IA", texte: '« Je cherche du riz en gros pas cher » : elle trouve, compare et te guide.', Illu: IlluIA },
  { titre: 'Ta liste, ton budget', texte: "Dis « j'ai trouvé les chaussures à 8 000 » : elle coche et calcule ce qu'il te reste.", Illu: IlluListe },
  { titre: 'Tu vends au marché ?', texte: 'Place ta boutique, ajoute tes photos et tes articles : les clients te trouvent.', Illu: IlluVendeur },
]
const N = SLIDES.length

export default function Decouverte() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { user } = useApp()
  const [index, setIndex] = useState(0)
  const [glisse, setGlisse] = useState(0) // déplacement du doigt en cours, en pixels
  const [echelle, setEchelle] = useState(1)
  const zone = useRef(null)
  const depart = useRef(null)
  const dernier = index === N - 1

  // Fin : depuis Profil on y retourne ; à la première ouverture on arrive sur Bienvenue
  const finir = () => {
    marquerVue()
    nav(state?.retour || (user?.verifie ? '/' : '/bienvenue'), { replace: true })
  }
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
  }, [])

  // L'illustration prend la largeur disponible, sans jamais pousser le texte hors de l'écran
  useLayoutEffect(() => {
    const el = zone.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setEchelle(Math.max(0.6, Math.min(1.15, (width - 48) / L, (height - 200) / H)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Swipe gauche/droite (doigt ou souris) ; un geste vertical est ignoré
  const debut = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    depart.current = { x: e.clientX, y: e.clientY, axe: null }
  }
  const bouge = e => {
    const d = depart.current
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (!d.axe) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) d.axe = 'x'
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

  return (
    <Screen fond="#FFFFFF">
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -left-20 top-1/3 w-64 h-64 rounded-full bg-sun/35 blur-3xl" />

        <header className="relative flex items-center gap-2.5 px-6 pt-5 pb-2">
          <div className="w-10 h-10 rounded-[14px] bg-brand flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(23,107,82,.9)]">
            <Icon size={22} stroke="#fff" width={2.4}><path d={I.pin} /><circle cx="12" cy="9" r="2.5" /></Icon>
          </div>
          <span className="h-display text-xl flex-1">Assimé</span>
          <button type="button" onClick={finir} aria-label="Passer la découverte"
            className={'h-11 px-3 -mr-3 rounded-full text-[15px] font-semibold text-[#3A3F4B] underline underline-offset-4 ' + (dernier ? 'invisible' : '')}>
            Passer
          </button>
        </header>

        <section ref={zone} aria-roledescription="carrousel" aria-label="Découvrir Assimé"
          className="relative flex-1 min-h-0 overflow-hidden select-none" style={{ touchAction: 'pan-y' }}
          onPointerDown={debut} onPointerMove={bouge} onPointerUp={fin} onPointerCancel={fin} onPointerLeave={fin}>
          <div className={'flex h-full ' + (glisse ? '' : 'dec-piste')} aria-live="polite"
            style={{ transform: `translateX(calc(${-index * 100}% + ${glisse}px))` }}>
            {SLIDES.map(({ titre, texte, Illu }, i) => {
              const actif = i === index
              return (
                <div key={titre} role="group" aria-roledescription="slide" aria-label={`${i + 1} sur ${N}`} aria-hidden={!actif}
                  className="w-full h-full shrink-0 px-6 pt-3 flex flex-col">
                  <div key={actif ? 'vue' : 'attente'} className={actif ? 'dec-in' : ''}>
                    <div className="mx-auto rounded-[30px] bg-white border border-line shadow-[0_20px_40px_-24px_rgba(23,107,82,.5)] overflow-hidden"
                      style={{ width: L * echelle, height: H * echelle }}>
                      <div className="relative origin-top-left" style={{ width: L, height: H, transform: `scale(${echelle})` }}>
                        <Illu />
                      </div>
                    </div>
                    <h1 className="h-display text-[28px] leading-[1.12] mt-6">{titre}</h1>
                    <p className="text-[15px] text-[#4B5160] leading-relaxed mt-2.5">{texte}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <footer className="relative px-6 pt-2 pb-7">
          <div className="flex items-center justify-center" role="group" aria-label="Progression">
            {SLIDES.map((s, i) => (
              <button key={s.titre} type="button" onClick={() => aller(i)} aria-label={`Slide ${i + 1} sur ${N} : ${s.titre}`}
                aria-current={i === index ? 'step' : undefined} className="h-8 px-1 flex items-center">
                <span className={'block h-2 rounded-full transition-all duration-300 ' + (i === index ? 'w-6 bg-brand' : 'w-2 bg-[#C4C8CF]')} />
              </button>
            ))}
          </div>
          <div className="flex gap-2.5 mt-3">
            {index > 0 && (
              <button type="button" onClick={() => aller(index - 1)} aria-label="Slide précédente"
                className="w-[52px] h-[52px] rounded-full border border-line bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Icon d={I.back} size={20} />
              </button>
            )}
            <button type="button" onClick={dernier ? finir : () => aller(index + 1)}
              aria-label={dernier ? 'Commencer' : `Suivant, slide ${index + 2} sur ${N}`}
              className="btn btn-main flex-1 h-[52px]">
              {dernier ? 'Commencer' : 'Suivant'}
            </button>
          </div>
        </footer>
      </div>
    </Screen>
  )
}
