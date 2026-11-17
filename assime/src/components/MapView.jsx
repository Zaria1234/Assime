// Carte Leaflet : plan (OpenStreetMap) par défaut, ou vue satellite (Esri)
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { MARCHE } from '../lib/geo'
import { Emoji, teinte, ICONES } from './art'
import { useApp } from '../store'

const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const PLAN = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

// ---------- Marqueurs façon Google Maps : rond blanc + icône de la catégorie, en SVG dans L.divIcon ----------
const echappe = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const POUCE = 'M7 10v10H4V10zM7 10l4-7c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7z'

// Icônes Phosphor des catégories (mêmes icônes et couleurs que ICONES / teinte), converties une fois en texte SVG
// au chargement, hors du rendu de React. Catégorie inconnue (ajoutée par un vendeur) : icône « Autre ».
const SVG_ICONES = (() => {
  const hote = document.createElement('div')
  const racine = createRoot(hote)
  const svg = {}
  for (const cat of Object.keys(ICONES)) {
    flushSync(() => racine.render(<Emoji key={cat} cat={cat} size={24} color={teinte(cat)[1]} />))
    svg[cat] = hote.innerHTML
  }
  racine.unmount()
  return svg
})()
const iconeSvg = (cat, taille) => (SVG_ICONES[cat] || SVG_ICONES.Autre).replace('width="24" height="24"', `width="${taille}" height="${taille}"`)

/** Rond blanc avec l'icône au centre. grand = lieu sélectionné ou destination (44 px, bordure verte, nom toujours visible). */
function rond({ cat, nom, coeurs = 0, grand = false, nomVisible = false }) {
  const t = grand ? 44 : 32, ic = grand ? 24 : 18, bord = grand ? 3 : 1
  const r = t / 2 - bord / 2
  const badge = coeurs > 0
    ? `<span class="map-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="#7B61F0" aria-hidden="true"><path d="${POUCE}"/></svg>${coeurs}</span>`
    : ''
  const etiquette = nom ? `<span class="map-nom${grand || nomVisible ? ' toujours' : ''}" style="top:${t + 1}px">${echappe(nom)}</span>` : ''
  return L.divIcon({
    className: 'map-rond',
    html: `<svg class="map-disque" width="${t}" height="${t}" viewBox="0 0 ${t} ${t}" aria-hidden="true"><circle cx="${t / 2}" cy="${t / 2}" r="${r}" fill="#fff" stroke="${grand ? '#176B52' : '#C9C9D1'}" stroke-width="${bord}"/><g transform="translate(${(t - ic) / 2} ${(t - ic) / 2})">${iconeSvg(cat, ic)}</g></svg>${badge}${etiquette}`,
    iconSize: [t, t], iconAnchor: [t / 2, t / 2], tooltipAnchor: [0, -t / 2],
  })
}
// Toi : point bleu-vert avec un halo léger
const meIcon = L.divIcon({
  className: 'map-rond',
  html: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#0E9F8E" opacity=".2"/><circle cx="20" cy="20" r="8" fill="#0E9F8E" stroke="#fff" stroke-width="3"/></svg>',
  iconSize: [40, 40], iconAnchor: [20, 20],
})
// Point de départ du trajet : rond blanc avec l'icône moto, nom toujours visible
const motoIcon = nom => rond({ cat: 'Parking', nom, nomVisible: true })

// ---------- Noms qui se chevauchent : on garde le plus important, on masque l'autre ----------
let toile = null
function largeurNom(nom, gras) {
  toile = toile || document.createElement('canvas').getContext('2d')
  toile.font = (gras ? '700 12px' : '600 11px') + ' Inter, sans-serif'
  return Math.min(132, toile.measureText(nom).width + 8)
}
const seTouchent = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
/** items : [{ mk, t (diamètre), nom, prio, fixe, coeurs }]. Chaque nom essaie plusieurs places autour de son rond
 *  (dessous, à droite, à gauche, dessus) et prend la première qui ne recouvre ni un rond, ni un badge, ni un nom
 *  plus important ; s'il n'y en a aucune, il est masqué. Les noms « fixes » (sélection, Ma moto) restent dessous. */
function arrangerNoms(m, items) {
  const places = items.map(it => {
    const pt = m.latLngToLayerPoint(it.mk.getLatLng()), r = it.t / 2
    const obstacles = [{ x: pt.x - r, y: pt.y - r, w: it.t, h: it.t }]
    if (it.coeurs > 0) obstacles.push({ x: pt.x + r - 12, y: pt.y - r - 7, w: 34, h: 16 })
    return { ...it, pt, r, obstacles, w: it.nom ? largeurNom(it.nom, it.fixe) : 0 }
  })
  const gardes = []
  places.filter(p => p.nom).sort((a, b) => b.prio - a.prio).forEach(p => {
    const el = p.mk.getElement()?.querySelector('.map-nom')
    const { pt, r, w } = p, h = p.fixe ? 16 : 15
    // [boîte sur la carte, position CSS dans le marqueur]
    const essais = [
      [{ x: pt.x - w / 2, y: pt.y + r + 1, w, h }, { left: '50%', right: 'auto', top: p.t + 1 + 'px', transform: 'translateX(-50%)' }],
      [{ x: pt.x + r + 3, y: pt.y - h / 2, w, h }, { left: p.t + 3 + 'px', right: 'auto', top: r - h / 2 + 'px', transform: 'none' }],
      [{ x: pt.x - r - 3 - w, y: pt.y - h / 2, w, h }, { left: 'auto', right: p.t + 3 + 'px', top: r - h / 2 + 'px', transform: 'none' }],
      [{ x: pt.x - w / 2, y: pt.y - r - 1 - h, w, h }, { left: '50%', right: 'auto', top: -h - 1 + 'px', transform: 'translateX(-50%)' }],
    ]
    const libre = b => !places.some(q => q.obstacles.some((o, k) => !(q === p && k === 0) && seTouchent(b, o))) && !gardes.some(g => seTouchent(b, g))
    const choix = p.fixe ? essais[0] : essais.find(([b]) => libre(b))
    if (el) {
      el.classList.toggle('masque', !choix)
      if (choix) Object.assign(el.style, choix[1])
    }
    if (choix) gardes.push(choix[0])
  })
}

/** Cadre la carte sur un point (au zoom donné) ou sur un ensemble de points */
function cadrer(m, f, zoom) {
  if (f.length > 1) m.fitBounds(f, { paddingTopLeft: [40, 110], paddingBottomRight: [40, 290], maxZoom: 19 }) // laisse la place au bandeau et à la carte du bas
  else m.setView(f[0], zoom)
}

/** Rond blanc avec une cible : recentre la carte (controle = la même ref passée à MapView) */
export function BoutonRecentrer({ controle }) {
  const { t } = useApp()
  return (
    <button type="button" onClick={() => controle.current?.recentrer()} aria-label={t('carte.recentrer')} title={t('carte.recentrer')}
      className="w-12 h-12 rounded-full bg-white border border-line text-ink flex items-center justify-center shadow-[0_6px_16px_-8px_rgba(22,24,29,.5)]">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  )
}

export default function MapView({
  center = MARCHE, zoom = 18, moi, moto, trajet = [], fantome = [], route = [],
  boutiques = [], lieux = [], arrets = [], selection, onBoutique, onClick, fit, recadrer = 0, controle, className = '', showToggle = true, togglePos = 'right-3 bottom-6',
}) {
  const el = useRef(null)
  const map = useRef(null)
  const layers = useRef({})
  const etiquettes = useRef([])
  const [mode, setMode] = useState('plan')
  const [credits, setCredits] = useState(false)
  const { t } = useApp()

  // Création de la carte
  useEffect(() => {
    const m = L.map(el.current, { zoomControl: false, attributionControl: false }).setView(center, zoom)
    layers.current.sat = L.tileLayer(SAT, { maxZoom: 20, maxNativeZoom: 19, attribution: 'Imagerie © Esri' })
    layers.current.plan = L.tileLayer(PLAN, { maxZoom: 20, maxNativeZoom: 19, attribution: '© OpenStreetMap' })
    let erreurs = 0
    const panne = () => { erreurs += 1; if (erreurs > 2) el.current?.classList.add('offline') }
    let chargee = false
    const ok = () => { chargee = true; el.current?.classList.remove('offline') }
    layers.current.sat.on('tileload', ok)
    layers.current.plan.on('tileload', ok)
    setTimeout(() => { if (!chargee) el.current?.classList.add('offline') }, 4000)
    layers.current.sat.on('tileerror', panne)
    layers.current.plan.on('tileerror', panne)
    layers.current.plan.addTo(m) // la carte s'ouvre en mode Plan
    layers.current.overlay = L.layerGroup().addTo(m)
    // Les noms des lieux apparaissent à partir du zoom 18
    const noms = () => { el.current?.classList.toggle('zoom-noms', m.getZoom() >= 18); arrangerNoms(m, etiquettes.current) }
    m.on('zoomend', noms)
    noms()
    map.current = m
    return () => m.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Satellite / plan
  useEffect(() => {
    const m = map.current, { sat, plan } = layers.current
    if (mode === 'sat') { m.removeLayer(plan); sat.addTo(m) } else { m.removeLayer(sat); plan.addTo(m) }
  }, [mode])

  // Clic sur la carte
  useEffect(() => {
    const m = map.current
    if (!onClick) return
    const h = e => onClick([e.latlng.lat, e.latlng.lng])
    m.on('click', h)
    return () => m.off('click', h)
  }, [onClick])

  // Dessin des éléments
  useEffect(() => {
    const g = layers.current.overlay
    g.clearLayers()
    const items = []
    if (fantome.length > 1) L.polyline(fantome, { color: '#5E6B65', weight: 3, dashArray: '6 8', opacity: .7 }).addTo(g)
    if (trajet.length > 1) { L.polyline(trajet, { color: '#FFFFFF', weight: 9 }).addTo(g); L.polyline(trajet, { color: '#176B52', weight: 5 }).addTo(g) }
    if (route.length > 1) {
            L.polyline(route, { color: '#F5A623', weight: 6 }).addTo(g)
    }
    lieux.forEach(l => {
      const grand = selection != null && l.id === selection
      const mk = L.marker(l.pos, { icon: rond({ cat: l.type || 'Lieu', nom: l.nom, grand }), zIndexOffset: grand ? 800 : 0, title: l.nom }).addTo(g)
      items.push({ mk, t: grand ? 44 : 32, nom: l.nom, prio: grand ? 1000 : 5, fixe: grand })
    })
    boutiques.forEach(b => {
      const grand = selection != null && b.id === selection
      const mk = L.marker(b.pos, { icon: rond({ cat: b.categorie || 'Tout', nom: b.nom, coeurs: b.coeurs, grand }), zIndexOffset: grand ? 800 : 100, title: b.nom }).addTo(g)
      items.push({ mk, t: grand ? 44 : 32, nom: b.nom, prio: grand ? 1000 : 10 + (b.coeurs || 0), fixe: grand, coeurs: b.coeurs })
      if (onBoutique) mk.on('click', () => onBoutique(b))
    })
    arrets.forEach((a, i) => L.marker(a.pos, { icon: L.divIcon({ className: '', html: `<div style="width:24px;height:24px;border-radius:50%;background:#fff;color:#16181D;border:2px solid #16181D;font:700 12px Inter,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.4)">${i + 1}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).bindTooltip(echappe(t('trajet.arret', { n: i + 1 })), { direction: 'top', className: 'map-pill' }).addTo(g))
    const depart = t('carte.depart')
    if (moto) items.push({ mk: L.marker(moto, { icon: motoIcon(depart), zIndexOffset: 900, title: depart }).addTo(g), t: 32, nom: depart, prio: 900, fixe: true })
    if (moi) items.push({ mk: L.marker(moi, { icon: meIcon, interactive: false, zIndexOffset: 1000 }).addTo(g), t: 20, nom: '', prio: 0 })
    etiquettes.current = items
    arrangerNoms(map.current, items)
  }, [moi, moto, trajet, fantome, route, boutiques, lieux, arrets, selection, onBoutique, t])

  // Cadrage : UNE seule fois, au premier cadre connu (le GPS bouge sans arrêt : on ne touche plus ensuite
  // au zoom ni à la position de l'utilisateur). On recadre seulement si la page le demande (recadrer change,
  // ex. au démarrage d'un guidage) ou si l'utilisateur touche « Recentrer ».
  const cadre = useRef({ fait: false, fit: null, moi: null })
  const fitKey = fit ? JSON.stringify(fit) : ''
  useEffect(() => {
    cadre.current.fit = fit && fit.length ? fit : null
    cadre.current.moi = moi || null
    if (cadre.current.fait || !fit?.length) return
    cadrer(map.current, fit, 19)
    cadre.current.fait = true
  }, [fitKey, moi]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (recadrer && cadre.current.fit) { cadrer(map.current, cadre.current.fit, 19); cadre.current.fait = true }
  }, [recadrer])
  // Bouton « Recentrer » (rendu par la page, voir BoutonRecentrer) : revient sur le cadre de la page, en gardant le zoom choisi
  useEffect(() => {
    if (!controle) return
    controle.current = {
      recentrer: () => {
        const m = map.current, f = cadre.current.fit || (cadre.current.moi ? [cadre.current.moi] : null)
        if (m && f) cadrer(m, f, m.getZoom())
      },
    }
    return () => { controle.current = null }
  }, [controle])

  return (
    <div className={(/\babsolute\b/.test(className) ? '' : 'relative ') + className}>
      <div ref={el} className="absolute inset-0" />
      <button type="button" onClick={() => setCredits(c => !c)} aria-label={t('carte.credits')} className="absolute left-2 bottom-2 z-[450] w-6 h-6 rounded-full bg-white/80 text-[11px] font-bold text-muted">i</button>
      {credits && <div className="absolute left-2 bottom-9 z-[450] bg-white rounded-lg px-2 py-1 text-[10px] text-muted shadow">{t('carte.creditsTexte')}</div>}
      {showToggle && (
        <div className={'absolute z-[500] flex overflow-hidden rounded-full shadow-md text-xs font-semibold ' + togglePos}>
          <button type="button" onClick={() => setMode('sat')} className={'px-3 py-2 ' + (mode === 'sat' ? 'bg-brand text-white' : 'bg-white text-ink')} aria-pressed={mode === 'sat'}>{t('carte.satellite')}</button>
          <button type="button" onClick={() => setMode('plan')} className={'px-3 py-2 ' + (mode === 'plan' ? 'bg-brand text-white' : 'bg-white text-ink')} aria-pressed={mode === 'plan'}>{t('carte.plan')}</button>
        </div>
      )}
    </div>
  )
}
