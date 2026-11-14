// Parler à l'IA en direct : on parle, elle répond à voix haute, puis elle réécoute.
// L'« IA » est locale pour la démo (lib/ia.js). Le jour J : appel à un vrai modèle via une fonction Vercel.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Screen, BackButton, MicIcon } from '../components/ui'
import { Wax, Coeurs, GlassIcon } from '../components/art'
import { LIEUX_UTILES } from '../data/demo'
import { chercherSurCarte } from '../lib/carte'
import { rechercher, assistantListe, categoriesDe, demanderIA, appliquerOperations, phraseBudget, NOMS_OUTILS } from '../lib/ia'
import { ecouter, microDisponible } from '../lib/voix'
import { fmtDist, distance } from '../lib/geo'

// Lit la réponse à voix haute et attend la fin
function direEtAttendre(texte) {
  return new Promise(resolve => {
    try {
      const u = new SpeechSynthesisUtterance(texte)
      u.lang = 'fr-FR'
      u.onend = resolve; u.onerror = resolve
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
      setTimeout(resolve, Math.min(15000, 1500 + texte.length * 70)) // filet de sécurité
    } catch { resolve() }
  })
}

const LISTE = /ajoute|trouv|achet|pris |coche|reste|combien|budget|si je prends|depens/i

export default function IA() {
  const nav = useNavigate()
  const { boutiques, moi, liste, setListe, budget, moto, noterInteret, coeursDe, user } = useApp()
  const [messages, setMessages] = useState([{ de: 'ia', texte: `Bonjour${user?.prenom ? ' ' + user.prenom : ''} ! Dis-moi ce que tu cherches au marché, ou parle-moi de ta liste.` }])
  const [phase, setPhase] = useState('repos') // repos | ecoute | reflexion | parle
  const [direct, setDirect] = useState(false)
  const [texte, setTexte] = useState('')
  const directRef = useRef(false)
  const bas = useRef(null)
  const micro = microDisponible()
  useEffect(() => { bas.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, phase])
  useEffect(() => () => { directRef.current = false; try { window.speechSynthesis.cancel() } catch { /* */ } }, [])

  const repondre = phrase => {
    if (LISTE.test(phrase)) {
      const r = assistantListe(phrase, liste, budget, boutiques)
      setListe(r.liste)
      return { texte: r.reponse, lien: { to: '/liste', label: 'Voir ma liste' } }
    }
    if (/moto|retour|ramene/i.test(phrase)) {
      return moto ? { texte: 'Je te ramène à ta moto par le chemin le plus court.', lien: { to: '/retour', label: 'Retour à ma moto' } }
        : { texte: "Tu n'as pas encore enregistré ton trajet. Touche « Enregistrer mon trajet » en arrivant, je pourrai te ramener." }
    }
    const r = rechercher(phrase, boutiques, moi, LIEUX_UTILES)
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
        return { ...rep, externes: trouves, texte: `${rep.inconnu} n'est pas une boutique du marché, mais je l'ai trouvé à Lomé : ${a.nom}${a.distance != null ? ', à ' + fmtDist(a.distance) : ''}. Je peux t'y guider.` }
      }
      return { ...rep, texte: `Je ne trouve « ${rep.inconnu} » ni dans le marché ni sur la carte de Lomé. Essaie un autre mot.` }
    } catch {
      return { ...rep, lien: { to: '/recherche?q=' + encodeURIComponent(rep.inconnu), label: 'Chercher sur la carte de Lomé' } }
    }
  }
  const allerExterne = x => nav(`/guidage/ext?lat=${x.pos[0]}&lng=${x.pos[1]}&nom=${encodeURIComponent(x.nom)}&note=${encodeURIComponent(x.adresse || '')}`)

  const tour = async phrase => {
    if (!phrase?.trim()) return
    setMessages(m => [...m, { de: 'moi', texte: phrase }])
    setPhase('reflexion')
    // 1. Vraie IA (Gemini). 2. Si pas de réseau ou pas de clé : IA locale.
    // « Si je prends… » reste calculé en local : c'est un calcul exact sur la liste.
    const ia = /si je prends/i.test(phrase) ? null
      : await demanderIA({ message: phrase, boutiques, lieux: LIEUX_UTILES, position: moi, liste, budget, moto, coeursDe, historique: messages })
    let rep
    if (ia) {
      let nouvelle = liste
      if (ia.operations.length) { nouvelle = appliquerOperations(liste, ia.operations); setListe(nouvelle) }
      const choisies = ia.boutiques.map(id => boutiques.find(b => b.id === id)).filter(Boolean)
        .map(b => ({ ...b, distance: moi ? distance(moi, b.pos) : null }))
      choisies.forEach(b => noterInteret(b.categorie))
      let texte = ia.reponse
      if (ia.parler_budget || ia.operations.some(o => o.type === 'cocher')) texte += ' ' + phraseBudget(nouvelle, budget)
      const lien = ia.action === 'retour_moto' && moto ? { to: '/retour', label: 'Retour à ma moto' }
        : ia.action === 'voir_liste' || ia.operations.length ? { to: '/liste', label: 'Voir ma liste' } : null
      const lieux = (ia.lieux || []).map(id => LIEUX_UTILES.find(l => l.id === id)).filter(Boolean).map(l => ({ ...l, distance: moi ? distance(moi, l.pos) : null }))
      const externes = (ia.lieux_lome || []).map(x => ({ ...x, distance: moi ? distance(moi, x.pos) : null }))
      rep = { texte, boutiques: choisies, lieux, externes, lien, source: 'Gemini', outils: ia.outils || [], sources: ia.sources || [] }
    } else {
      rep = { ...(await completerAvecCarte(repondre(phrase))), source: 'IA locale' }
    }
    setMessages(m => [...m, { de: 'ia', ...rep }])
    setPhase('parle')
    await direEtAttendre(rep.texte)
    setPhase('repos')
    if (directRef.current) ecouterUneFois()
  }

  const ecouterUneFois = async () => {
    setPhase('ecoute')
    try { await tour(await ecouter()) } catch {
      setPhase('repos')
      if (directRef.current) { directRef.current = false; setDirect(false) }
    }
  }

  const basculer = () => {
    if (direct) { directRef.current = false; setDirect(false); setPhase('repos'); try { window.speechSynthesis.cancel() } catch { /* */ } return }
    directRef.current = true; setDirect(true); ecouterUneFois()
  }

  const statut = { repos: direct ? 'En direct' : micro ? 'Touche pour parler' : 'Écris ta question', ecoute: "Je t'écoute…", reflexion: 'Je réfléchis…', parle: 'Je réponds…' }[phase]

  return (
    <Screen>
      <div className="px-5 pt-5 flex items-center gap-3">
        <BackButton />
        <div className="flex-1"><div className="text-[12px] text-muted">Assimé</div><h1 className="h-display text-[22px] leading-tight">IA en direct</h1></div>
        <span className={'h-8 px-3 rounded-full text-[12px] font-semibold flex items-center gap-1.5 ' + (direct ? 'bg-[#E6F4EC] text-[#137A52]' : 'bg-white border border-line text-muted')}>
          <span className={'w-2 h-2 rounded-full ' + (direct ? 'bg-brand animate-pulse' : 'bg-field')} />{direct ? 'En direct' : 'En pause'}
        </span>
      </div>

      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pt-5 pb-3 flex flex-col gap-4">
        {messages.map((m, i) => m.de === 'moi'
          ? <div key={i} className="self-end max-w-[290px] bg-ink text-white rounded-[20px] rounded-br-md px-4 py-3 text-[15px] leading-relaxed">{m.texte}</div>
          : (
            <div key={i} className="self-start max-w-[320px] flex flex-col gap-3">
              <div className="bg-white border border-line rounded-[20px] rounded-bl-md px-4 py-3 text-[15px] leading-relaxed">{m.texte}</div>
              {m.source && (
                <div className="-mt-1.5 flex flex-wrap gap-1.5">
                  <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full ' + (m.source === 'Gemini' ? 'bg-[#E6F4EC] text-[#137A52]' : 'bg-white border border-line text-muted')}>{m.source === 'Gemini' ? '✦ Gemini' : 'IA locale (hors ligne)'}</span>
                  {(m.outils || []).map(o => <span key={o} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-line text-muted">{NOMS_OUTILS[o] || o}</span>)}
                </div>
              )}
              {m.sources?.length > 0 && (
                <div className="text-[11px] text-muted leading-relaxed">Sources : {m.sources.map((x, k) => <a key={k} href={x.url} target="_blank" rel="noreferrer" className="underline mr-2">{x.titre}</a>)}</div>
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
                      <button type="button" onClick={() => nav('/guidage/' + b.id)} className="h-9 px-3 rounded-full bg-ink text-white text-[12px] font-semibold">Y aller</button>
                    </div>
                  ))}
                </div>
              )}
              {m.lieux?.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {m.lieux.map(l => (
                    <div key={l.id} className="bg-white border border-line rounded-[18px] p-2.5 flex items-center gap-3">
                      <GlassIcon cat={l.type} size={48} />
                      <div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{l.nom}</div><div className="text-[12px] text-muted truncate">{l.distance != null ? fmtDist(l.distance) + ' · ' : ''}{l.type}</div></div>
                      <button type="button" onClick={() => nav('/guidage/' + l.id)} className="h-9 px-3 rounded-full bg-ink text-white text-[12px] font-semibold">Y aller</button>
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
                      <button type="button" onClick={() => allerExterne(x)} className="h-9 px-3 rounded-full bg-ink text-white text-[12px] font-semibold">Y aller</button>
                    </div>
                  ))}
                  <span className="text-[10px] text-muted">Carte de Lomé © OpenStreetMap</span>
                </div>
              )}
              {m.lien && <Link to={m.lien.to} className="self-start h-9 px-3.5 rounded-full bg-ink text-white text-[12px] font-semibold flex items-center no-underline">{m.lien.label}</Link>}
            </div>
          ))}
        {phase === 'reflexion' && <div className="self-start bg-white border border-line rounded-[20px] px-4 py-3 text-muted tracking-widest">•••</div>}
        <div ref={bas} />
      </div>

      <div className="px-5 pt-1 flex gap-2 overflow-x-auto no-scrollbar">
        {['Je cherche du riz en gros', 'Où est la pharmacie ?', 'Où trouver des mèches ?', 'Tu connais Ramco ?', 'Combien il me reste ?', 'Ramène-moi à ma moto'].map(p => (
          <button key={p} type="button" onClick={() => tour(p)} disabled={phase !== 'repos'} className="h-9 px-3.5 rounded-full bg-white border border-line text-[12px] font-semibold shrink-0">{p}</button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2.5 pt-5 pb-3">
        <button type="button" onClick={basculer} disabled={!micro} aria-label={direct ? "Arrêter la conversation" : "Parler à l'IA en direct"}
          className={'relative w-[84px] h-[84px] rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 ' + (direct ? 'bg-brand' : 'bg-ink')}>
          {direct && <span className="absolute inset-0 rounded-full bg-brand/30 animate-ping" />}
          {direct ? <span className="relative w-6 h-6 rounded-[6px] bg-white" /> : <MicIcon size={34} />}
        </button>
        <div className="text-[13px] font-semibold">{statut}</div>
        {!micro && <div className="text-[12px] text-muted text-center px-8">Le micro marche sur le lien de l'app (Chrome ou Safari). Ici, écris ta question.</div>}
      </div>

      <form onSubmit={e => { e.preventDefault(); tour(texte); setTexte('') }} className="px-5 pb-5 flex gap-2">
        <label htmlFor="q-ia" className="sr-only">Ta question</label>
        <input id="q-ia" className="field h-12 flex-1 min-w-0" placeholder="Ou écris ici…" value={texte} onChange={e => setTexte(e.target.value)} />
        <button type="submit" disabled={!texte.trim() || phase !== 'repos'} className="btn bg-brand text-white h-12 px-4 text-sm">Envoyer</button>
      </form>
    </Screen>
  )
}
