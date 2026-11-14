// Carte Leaflet : vue satellite (Esri) ou plan (OpenStreetMap)
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MARCHE } from '../lib/geo'

const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const PLAN = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

// Marqueurs plats, aux couleurs de l'app, sans halo
const pin = (color, size = 14, bord = '#fff') => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${bord === '#fff' ? 2 : 3}px solid ${bord}"></div>`,
  iconSize: [size + 4, size + 4], iconAnchor: [(size + 4) / 2, (size + 4) / 2],
})
// Boutique avec ses coups de cœur (pouces levés visibles par tous)
const pinCoeur = n => L.divIcon({
  className: '',
  html: `<div style="display:flex;align-items:center;gap:4px;transform:translate(-8px,-8px)"><div style="width:14px;height:14px;border-radius:50%;background:#7B61F0;border:2px solid #fff;flex-shrink:0"></div><div style="display:flex;align-items:center;gap:3px;background:#fff;color:#5A3FD6;font:700 11px Inter,sans-serif;padding:2px 6px 2px 5px;border-radius:999px;border:1px solid #ECECF1"><svg width="11" height="11" viewBox="0 0 24 24" fill="#7B61F0"><path d="M7 10v10H4V10zM7 10l4-7c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7z"/></svg>${n}</div></div>`,
  iconSize: [0, 0], iconAnchor: [0, 0],
})
const motoIcon = L.divIcon({
  className: '',
  html: '<div style="background:#16181D;color:#fff;font:700 12px Inter,sans-serif;padding:5px 10px;border-radius:999px;border:2px solid #fff;white-space:nowrap">Ma moto</div>',
  iconSize: [70, 26], iconAnchor: [35, 30],
})
const meIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#F5A623;border:3px solid #fff;box-shadow:0 0 0 1px #16181D"></div>',
  iconSize: [18, 18], iconAnchor: [9, 9],
})

export default function MapView({
  center = MARCHE, zoom = 18, moi, moto, trajet = [], fantome = [], route = [],
  boutiques = [], lieux = [], arrets = [], onBoutique, onClick, fit, className = '', showToggle = true, togglePos = 'right-3 bottom-6',
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
    lieux.forEach(l => L.marker(l.pos, { icon: pin('#fff', 10, '#7B61F0') }).bindTooltip(l.nom, { direction: 'top', className: 'map-pill' }).addTo(g))
    boutiques.forEach(b => {
      const mk = L.marker(b.pos, { icon: b.coeurs > 0 ? pinCoeur(b.coeurs) : pin('#7B61F0') }).bindTooltip(b.nom, { direction: 'top', className: 'map-pill' }).addTo(g)
      if (onBoutique) mk.on('click', () => onBoutique(b))
    })
    arrets.forEach((a, i) => L.marker(a.pos, { icon: L.divIcon({ className: '', html: `<div style="width:24px;height:24px;border-radius:50%;background:#fff;color:#16181D;border:2px solid #16181D;font:700 12px Inter,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.4)">${i + 1}</div>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).bindTooltip(a.nom, { direction: 'top', className: 'map-pill' }).addTo(g))
    if (moto) L.marker(moto, { icon: motoIcon }).addTo(g)
    if (moi) L.marker(moi, { icon: meIcon, interactive: false }).addTo(g)
  }, [moi, moto, trajet, fantome, route, boutiques, lieux, arrets, onBoutique])

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
