// Parler à l'IA en direct : on parle, elle répond à voix haute (dans la langue choisie), puis elle réécoute.
// IA en ligne (Gemini via /api/ia) ; sans réseau, IA locale (lib/ia.js).
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Screen, BackButton, MicIcon } from '../components/ui'
import { Wax, Coeurs, GlassIcon } from '../components/art'
import { LIEUX_UTILES } from '../data/demo'
import { chercherSurCarte } from '../lib/carte'
import { rechercher, assistantListe, categoriesDe, demanderIA, appliquerOperations, phraseBudget } from '../lib/ia'
import { ecouter, microDisponible } from '../lib/voix'
import { fmtDist, distance } from '../lib/geo'
import { voixDe } from '../i18n'
import { Puce, Reflexion } from './Autres'

// Lit la réponse à voix haute (fr-FR ou en-US) et attend la fin
function direEtAttendre(texte, lang) {
  return new Promise(resolve => {
    try {
      const u = new SpeechSynthesisUtterance(texte)
      u.lang = lang
      u.onend = resolve; u.onerror = resolve
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
      setTimeout(resolve, Math.min(15000, 1500 + texte.length * 70)) // filet de sécurité
    } catch { resolve() }
  })
}

const LISTE = /ajoute|trouv|achet|pris |coche|reste|combien|budget|si je prends|depens|\badd\b|found|bought|how much|left|spent|if i (take|buy)/i
const RETOUR = /moto|retour|ramene|ramène|point de d[ée]part|take me back|starting point|way back/i
const PUCES = ['ia.c1', 'ia.c2', 'ia.c3', 'ia.c4', 'ia.c5', 'ia.c6']

export default function IA() {
  const nav = useNavigate()
  const { boutiques, moi, liste, setListe, budget, moto, noterInteret, coeursDe, user, langue, t, lieuTraduit } = useApp()
  const [messages, setMessages] = useState([{ de: 'ia', accueil: true }])
  const [phase, setPhase] = useState('repos') // repos | ecoute | reflexion | parle
  const [direct, setDirect] = useState(false)
  const [texte, setTexte] = useState('')
  const [puce, setPuce] = useState(null) // phrase rapide touchée (verte jusqu'à la réponse)
  const directRef = useRef(false)
  const bas = useRef(null)
  const micro = microDisponible()
  const occupe = phase === 'reflexion' || phase === 'parle'
  useEffect(() => { bas.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, phase])
  useEffect(() => () => { directRef.current = false; try { window.speechSynthesis.cancel() } catch { /* */ } }, [])
  const lieux = LIEUX_UTILES.map(lieuTraduit)

  const repondre = phrase => {
    if (LISTE.test(phrase)) {
      const r = assistantListe(phrase, liste, budget, boutiques, langue)
      setListe(r.liste)
      return { texte: r.reponse, lien: { to: '/liste', cle: 'ia.voirListe' } }
    }
    if (RETOUR.test(phrase)) {
      return moto ? { texte: t('ia.jeTeRamene'), lien: { to: '/retour', cle: 'ia.retourDepart' } } : { texte: t('ia.pasEnregistre') }
    }
    const r = rechercher(phrase, boutiques, moi, lieux, langue)
    categoriesDe(phrase).forEach(noterInteret)
    return { texte: r.reponse, boutiques: r.resultats.slice(0, 3), lieux: r.lieux.slice(0, 2), inconnu: r.inconnu }
  }

  // Lieu hors du marché (Ramco, une banque de Lomé…) : on le cherche sur la carte de Lomé (OpenStreetMap)
  const completerAvecCarte = async rep => {
    if (!rep.inconnu) return rep
    try {
      const trouves = (await chercherSurCarte(rep.inconnu)).slice(0, 3).map(x => ({ ...x, distance: moi ? distance(moi, x.pos) : null }))
      if (trouves.length) {
        const a = trouves[0]
        return { ...rep, externes: trouves, texte: t('ia.externe', { q: rep.inconnu, nom: a.nom, dist: a.distance != null ? t('iaL.dist', { d: fmtDist(a.distance) }) : '' }) }
      }
      return { ...rep, texte: t('ia.introuvable', { q: rep.inconnu }) }
    } catch {
      return { ...rep, lien: { to: '/recherche?q=' + encodeURIComponent(rep.inconnu), cle: 'ia.chercherCarte' } }
    }
  }
  const allerExterne = x => nav(`/guidage/ext?lat=${x.pos[0]}&lng=${x.pos[1]}&nom=${encodeURIComponent(x.nom)}&note=${encodeURIComponent(x.adresse || '')}`)

  const tour = async (phrase, depuisPuce = null) => {
    if (!phrase?.trim()) return
    // Le message part tout de suite, avec « L'IA réfléchit… » en dessous
    setPuce(depuisPuce)
    setMessages(m => [...m, { de: 'moi', texte: phrase }])
    setPhase('reflexion')
    let rep
    try {
      // 1. IA en ligne, qui répond dans la langue choisie. 2. Sans réseau ou sans clé : IA locale (« Mode hors ligne »).
      // « Si je prends… » reste calculé en local : c'est un calcul exact sur la liste.
      const ia = /si je prends|if i (take|buy)/i.test(phrase) ? null
        : await demanderIA({ message: phrase, boutiques, lieux: LIEUX_UTILES, position: moi, liste, budget, moto, coeursDe, historique: messages.filter(m => m.texte), langue })
      if (ia) {
        let nouvelle = liste
        if (ia.operations.length) { nouvelle = appliquerOperations(liste, ia.operations); setListe(nouvelle) }
        const choisies = ia.boutiques.map(id => boutiques.find(b => b.id === id)).filter(Boolean)
          .map(b => ({ ...b, distance: moi ? distance(moi, b.pos) : null }))
        choisies.forEach(b => noterInteret(b.categorie))
        let x = ia.reponse
        if (ia.parler_budget || ia.operations.some(o => o.type === 'cocher')) x += ' ' + phraseBudget(nouvelle, budget, langue)
        const lien = ia.action === 'retour_moto' && moto ? { to: '/retour', cle: 'ia.retourDepart' }
          : ia.action === 'voir_liste' || ia.operations.length ? { to: '/liste', cle: 'ia.voirListe' } : null
        const lx = (ia.lieux || []).map(id => lieux.find(l => l.id === id)).filter(Boolean).map(l => ({ ...l, distance: moi ? distance(moi, l.pos) : null }))
        const externes = (ia.lieux_lome || []).map(e => ({ ...e, distance: moi ? distance(moi, e.pos) : null }))
        rep = { texte: x, boutiques: choisies, lieux: lx, externes, lien, source: 'en ligne', sources: ia.sources || [] }
      } else {
        rep = { ...(await completerAvecCarte(repondre(phrase))), source: 'hors ligne' }
      }
    } catch (e) {
      console.error('[Assimé] IA', e)
      rep = { texte: t('erreur.echec') }
    }
    setMessages(m => [...m, { de: 'ia', ...rep }])
    setPuce(null)
    setPhase('parle')
    await direEtAttendre(rep.texte, voixDe(langue))
    setPhase('repos')
    if (directRef.current) ecouterUneFois()
  }

  const ecouterUneFois = async () => {
    setPhase('ecoute')
    try { await tour(await ecouter(voixDe(langue))) } catch {
      setPhase('repos')
      if (directRef.current) { directRef.current = false; setDirect(false) }
    }
  }

  const basculer = () => {
    if (direct) { directRef.current = false; setDirect(false); setPhase('repos'); try { window.speechSynthesis.cancel() } catch { /* */ } return }
    directRef.current = true; setDirect(true); ecouterUneFois()
  }

  const statut = { repos: direct ? t('ia.direct') : micro ? t('ia.toucher') : t('ia.ecrire'), ecoute: t('ia.ecoute'), reflexion: t('ia.reflexion'), parle: t('ia.parle') }[phase]

  return (
    <Screen>
      <div className="px-5 pt-5 flex items-center gap-3">
        <BackButton />
        <div className="flex-1"><div className="text-[12px] text-muted">Assimé</div><h1 className="h-display text-[22px] leading-tight">{t('ia.titre')}</h1></div>
        <span className={'h-8 px-3 rounded-full text-[12px] font-semibold flex items-center gap-1.5 ' + (direct ? 'bg-[#E6F4EC] text-[#137A52]' : 'bg-white border border-line text-muted')}>
          <span className={'w-2 h-2 rounded-full ' + (direct ? 'bg-brand animate-pulse' : 'bg-field')} />{direct ? t('ia.direct') : t('ia.enPause')}
        </span>
      </div>

      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pt-5 pb-3 flex flex-col gap-4">
        {messages.map((m, i) => m.de === 'moi'
          ? <div key={i} className="self-end max-w-[290px] bg-ink text-white rounded-[20px] rounded-br-md px-4 py-3 text-[15px] leading-relaxed">{m.texte}</div>
          : (
            <div key={i} className="self-start max-w-[320px] flex flex-col gap-3">
              <div className="bg-white border border-line rounded-[20px] rounded-bl-md px-4 py-3 text-[15px] leading-relaxed">{m.accueil ? t('ia.bonjour', { nom: user?.prenom ? ' ' + user.prenom : '' }) : m.texte}</div>
              {m.source && (
                <div className="-mt-1.5 flex flex-wrap gap-1.5">
                  <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full ' + (m.source === 'en ligne' ? 'bg-[#E6F4EC] text-[#137A52]' : 'bg-white border border-line text-muted')}>{m.source === 'en ligne' ? t('ia.enLigne') : t('ia.horsLigne')}</span>
                </div>
              )}
              {m.sources?.length > 0 && (
                <div className="text-[11px] text-muted leading-relaxed">{t('ia.sources')} {m.sources.map((x, k) => <a key={k} href={x.url} target="_blank" rel="noreferrer" className="underline mr-2">{x.titre}</a>)}</div>
              )}
              {m.boutiques?.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {m.boutiques.map(b => (
                    <div key={b.id} className="bg-white border border-line rounded-[18px] p-2.5 flex items-center gap-3">
                      <Wax image={b.couverture} className="w-12 h-12 rounded-[14px] shrink-0" />
                      <Link to={'/boutique/' + b.id} className="flex-1 min-w-0 no-underline text-ink">
                        <div className="font-semibold text-[14px] truncate">{b.nom}</div>
                        <div className="mt-1"><Coeurs n={coeursDe(b.id).affiches} className="!bg-[#E6F4EC] !h-5" /></div>
                      </Link>
                      <button type="button" onClick={() => nav('/guidage/' + b.id)} className="h-9 px-3 rounded-full bg-ink text-white text-[12px] font-semibold">{t('commun.yAller')}</button>
                    </div>
                  ))}
                </div>
              )}
              {m.lieux?.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {m.lieux.map(l => (
                    <div key={l.id} className="bg-white border border-line rounded-[18px] p-2.5 flex items-center gap-3">
                      <GlassIcon cat={l.type} size={48} />
                      <div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{l.nom}</div><div className="text-[12px] text-muted truncate">{l.distance != null ? fmtDist(l.distance) + ' · ' : ''}{l.note || l.type}</div></div>
                      <button type="button" onClick={() => nav('/guidage/' + l.id)} className="h-9 px-3 rounded-full bg-ink text-white text-[12px] font-semibold">{t('commun.yAller')}</button>
                    </div>
                  ))}
                </div>
              )}
              {m.externes?.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {m.externes.map(x => (
                    <div key={x.id} className="bg-white border border-line rounded-[18px] p-2.5 flex items-center gap-3">
                      <GlassIcon cat="Lieu" size={48} />
                      <div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{x.nom}</div><div className="text-[12px] text-muted truncate">{x.distance != null ? fmtDist(x.distance) + ' · ' : ''}{x.adresse || 'Lomé'}</div></div>
                      <button type="button" onClick={() => allerExterne(x)} className="h-9 px-3 rounded-full bg-ink text-white text-[12px] font-semibold">{t('commun.yAller')}</button>
                    </div>
                  ))}
                  <span className="text-[10px] text-muted">{t('ia.carteLome')}</span>
                </div>
              )}
              {m.lien && <Link to={m.lien.to} className="self-start h-9 px-3.5 rounded-full bg-ink text-white text-[12px] font-semibold flex items-center no-underline">{t(m.lien.cle)}</Link>}
            </div>
          ))}
        {phase === 'reflexion' && <Reflexion />}
        <div ref={bas} />
      </div>

      <div className="px-5 pt-1 flex gap-2 overflow-x-auto no-scrollbar">
        {PUCES.map(c => <Puce key={c} texte={t(c)} active={puce === c} bloque={phase !== 'repos'} onClick={() => tour(t(c), c)} />)}
      </div>

      <div className="flex flex-col items-center gap-2.5 pt-5 pb-3">
        {/* En mode direct, le micro reste actif pour pouvoir arrêter la conversation */}
        <button type="button" onClick={basculer} disabled={!micro || (occupe && !direct)} aria-label={direct ? t('ia.arreterConversation') : t('ia.parlerDirect')}
          className={'relative w-[84px] h-[84px] rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 ' + (direct ? 'bg-brand' : 'bg-ink')}>
          {direct && <span className="absolute inset-0 rounded-full bg-brand/30 animate-ping" />}
          {direct ? <span className="relative w-6 h-6 rounded-[6px] bg-white" /> : <MicIcon size={34} />}
        </button>
        <div className="text-[13px] font-semibold">{statut}</div>
        {!micro && <div className="text-[12px] text-muted text-center px-8">{t('ia.microAide')}</div>}
      </div>

      <form onSubmit={e => { e.preventDefault(); if (phase !== 'repos') return; tour(texte); setTexte('') }} className="px-5 pb-5 flex gap-2">
        <label htmlFor="q-ia" className="sr-only">{t('ia.question')}</label>
        <input id="q-ia" className="field h-12 flex-1 min-w-0" placeholder={t('ia.placeholder')} value={texte} onChange={e => setTexte(e.target.value)} />
        <button type="submit" disabled={!texte.trim() || phase !== 'repos'} aria-busy={occupe || undefined} className="btn bg-brand text-white h-12 px-4 text-sm disabled:opacity-50">{t('ia.envoyer')}</button>
      </form>
    </Screen>
  )
}
