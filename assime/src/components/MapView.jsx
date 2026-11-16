// Carte Leaflet : vue satellite (Esri) ou plan (OpenStreetMap)
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { MARCHE } from '../lib/geo'
import { Emoji, teinte, ICONES } from './art'

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
// Ma moto : rond blanc avec l'icône moto, nom toujours visible
const motoIcon = () => rond({ cat: 'Parking', nom: 'Ma moto', nomVisible: true })

export default function MapView({
  center = MARCHE, zoom = 18, moi, moto, trajet = [], fantome = [], route = [],
  boutiques = [], lieux = [], arrets = [], selection, onBoutique, onClick, fit, className = '', showToggle = true, togglePos = 'right-3 bottom-6',
}) {
  const el = useRef(null)
  const map = useRef(null)
  const layers = useRef({})
  const [mode, setMode] = useState('sat')
  const [credits, setCredits] = useState(false)

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
    layers.current.sat.addTo(m)
    layers.current.overlay = L.layerGroup().addTo(m)
    // Les noms des lieux apparaissent à partir du zoom 18
    const noms = () => el.current?.classList.toggle('zoom-noms', m.getZoom() >= 18)
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
    if (fantome.length > 1) L.polyline(fantome, { color: '#5E6B65', weight: 3, dashArray: '6 8', opacity: .7 }).addTo(g)
    if (trajet.length > 1) { L.polyline(trajet, { color: '#FFFFFF', weight: 9 }).addTo(g); L.polyline(trajet, { color: '#176B52', weight: 5 }).addTo(g) }
    if (route.length > 1) {
            L.polyline(route, { color: '#F5A623', weight: 6 }).addTo(g)
    }
    lieux.forEach(l => {
      const grand = selection != null && l.id === selection
      L.marker(l.pos, { icon: rond({ cat: l.type || 'Lieu', nom: l.nom, grand }), zIndexOffset: grand ? 800 : 0, title: l.nom }).addTo(g)
    })
    boutiques.forEach(b => {
      const grand = selection != null && b.id === selection
      const mk = L.marker(b.pos, { icon: rond({ cat: b.categorie || 'Tout', nom: b.nom, coeurs: b.coeurs, grand }), zIndexOffset: grand ? 800 : 100, title: b.nom }).addTo(g)
      if (onBoutique) mk.on('click', () => onBoutique(b))
    })
    arrets.forEach((a, i) => L.marker(a.pos, { icon: L.divIcon({ className: '', html: `<div style="width:24px;height:24px;border-radius:50%;background:#fff;color:#16181D;border:2px solid #16181D;font:700 12px Inter,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.4)">${i + 1}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).bindTooltip(echappe(a.nom), { direction: 'top', className: 'map-pill' }).addTo(g))
    if (moto) L.marker(moto, { icon: motoIcon(), zIndexOffset: 900, title: 'Ma moto' }).addTo(g)
    if (moi) L.marker(moi, { icon: meIcon, interactive: false, zIndexOffset: 1000 }).addTo(g)
  }, [moi, moto, trajet, fantome, route, boutiques, lieux, arrets, selection, onBoutique])

  // Cadrage
  const fitKey = fit ? JSON.stringify(fit) : ''
  useEffect(() => {
    if (fit && fit.length > 1) map.current.fitBounds(fit, { paddingTopLeft: [40, 110], paddingBottomRight: [40, 290], maxZoom: 19 }) // laisse la place au bandeau et à la carte du bas
    else if (fit && fit.length === 1) map.current.setView(fit[0], 19)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  return (
    <div className={(/\babsolute\b/.test(className) ? '' : 'relative ') + className}>
      <div ref={el} className="absolute inset-0" />
      <button type="button" onClick={() => setCredits(c => !c)} aria-label="Crédits de la carte" className="absolute left-2 bottom-2 z-[450] w-6 h-6 rounded-full bg-white/80 text-[11px] font-bold text-muted">i</button>
      {credits && <div className="absolute left-2 bottom-9 z-[450] bg-white rounded-lg px-2 py-1 text-[10px] text-muted shadow">Carte : © Esri, © OpenStreetMap · Leaflet</div>}
      {showToggle && (
        <div className={'absolute z-[500] flex overflow-hidden rounded-full shadow-md text-xs font-semibold ' + togglePos}>
          <button type="button" onClick={() => setMode('sat')} className={'px-3 py-2 ' + (mode === 'sat' ? 'bg-brand text-white' : 'bg-white text-ink')}>Satellite</button>
          <button type="button" onClick={() => setMode('plan')} className={'px-3 py-2 ' + (mode === 'plan' ? 'bg-brand text-white' : 'bg-white text-ink')}>Plan</button>
        </div>
      )}
    </div>
  )
}
