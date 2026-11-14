// Explorer, ma liste du marché, assistant vocal, missions, profil
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import { Screen, TopBar, Icon, I, MicIcon, UserIcon, EtatServeur } from '../components/ui'
import { Wax, Ring, GlassIcon, Coeurs } from '../components/art'
import { CATEGORIES, LIEUX_UTILES, ZONES, SECTIONS } from '../data/demo'
import { fmtDist, fmtMoney } from '../lib/geo'
import { assistantListe, bilan, suggestions, sectionsIA, demanderIA, appliquerOperations, phraseBudget } from '../lib/ia'
import { ecouter, microDisponible } from '../lib/voix'

function CarteBoutique({ b, large = false }) {
  const { favoris, coeursDe } = useApp()
  const prix = Math.min(...(b.articles || []).filter(a => a.prix).map(a => a.prix), Infinity)
  return (
    <Link to={'/boutique/' + b.id} className={'bg-white rounded-[22px] p-2 border border-line no-underline text-ink shrink-0 ' + (large ? 'w-[168px]' : '')}>
      <Wax image={b.couverture} className="h-[96px] rounded-[16px]">
        {b.verifiee && <span className="absolute left-2 top-2 px-2 py-0.5 rounded-full bg-white text-ink text-[10px] font-bold">Vérifiée</span>}
        {favoris.includes(b.id) && <span className="absolute right-2 top-2 text-[#E5484D]"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={I.heart} /></svg></span>}
        {coeursDe(b.id).affiches > 0 && <Coeurs n={coeursDe(b.id).affiches} className="absolute left-2 bottom-2" />}
      </Wax>
      <div className="px-2 pt-3 pb-2">
        <div className="text-[14px] font-semibold leading-snug line-clamp-2 min-h-[38px]">{b.nom}</div>
        <div className="text-[12px] text-muted mt-1.5">{isFinite(prix) ? 'dès ' + fmtMoney(prix) + ' F' : b.categorie}{b.gros ? ' · gros' : ''}</div>
      </div>
    </Link>
  )
}

export function Explorer() {
  const { boutiques, user, favoris, coeursDe, interets } = useApp()
  const [filtre, setFiltre] = useState('Tout')
  // « Pour toi » : boutiques choisies par l'IA selon ce que l'utilisateur cherche et regarde
  const pourToi = new Set(sectionsIA({ sections: SECTIONS, interets, boutiques, coeursDe }).flatMap(s => s.boutiques.map(b => b.id)))
  const section = id => SECTIONS.find(s => s.id === id)
  const dans = sec => b => sec.cats.includes(b.categorie) && (!sec.gros || b.gros)
  const DEJA = ['Alimentation', 'Artisanat'] // couvertes par les filtres ci-dessous
  const filtres = [
    { id: 'Tout', test: () => true },
    { id: 'Pour toi', test: b => pourToi.has(b.id) },
    { id: 'Favoris', test: b => favoris.includes(b.id) },
    { id: 'Tourisme et souvenirs', test: dans(section('tourisme')) },
    { id: 'Alimentation générale', test: dans(section('alimentation')) },
    { id: 'Grossistes', test: b => !!b.gros },
    ...[...CATEGORIES, ...new Set(boutiques.map(b => b.categorie))].filter((c, k, arr) => arr.indexOf(c) === k && !DEJA.includes(c) && boutiques.some(b => b.categorie === c))
      .map(c => ({ id: c, test: b => b.categorie === c })),
  ]
  const actif = filtres.find(f => f.id === filtre) || filtres[0]
  const liste = boutiques.filter(actif.test).sort((x, y) => coeursDe(y.id).affiches - coeursDe(x.id).affiches)
  const zone = ZONES[0]
  const voirZone = () => { setFiltre(zone.categorie); document.getElementById('boutiques')?.scrollIntoView({ behavior: 'smooth' }) }
  return (
    <Screen nav>
      <div className="flex-1 min-h-0 scroll no-scrollbar relative pb-6">
        <div className="px-5 pt-6 flex items-center justify-between">
          <div>
            <div className="text-[13px] text-muted">Salut {user?.prenom || ''}</div>
            <h1 className="h-display text-[30px] leading-[1.1] mt-1">Explorer le marché</h1>
          </div>
          <Link to="/recherche" aria-label="Rechercher" className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center text-ink"><Icon><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Icon></Link>
        </div>

        <button type="button" onClick={voirZone} className="mx-5 mt-6 w-[calc(100%-40px)] rounded-[28px] bg-lilac p-6 text-left shadow-[0_18px_30px_-18px_rgba(90,63,214,.8)]">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-ink/70">Zone à découvrir</span>
          <span className="block h-display text-[26px] leading-[1.1] mt-2 text-ink">{zone.nom}</span>
          <span className="block text-[13px] text-ink/70 mt-2">{zone.distanceMin} min à pied · {boutiques.filter(b => b.categorie === zone.categorie).length} boutiques</span>
          <span className="mt-4 inline-flex h-10 pl-4 pr-1 rounded-full bg-ink text-white text-[13px] font-semibold items-center gap-2">Y aller<span className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center text-base">›</span></span>
        </button>

        <Link to="/ia" className="mx-5 mt-4 rounded-[24px] bg-white border border-line p-4 flex items-center gap-3.5 no-underline text-ink">
          <span className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><MicIcon size={22} /></span>
          <span className="flex-1"><b className="block text-[15px]">Parler à l'IA en direct</b><span className="block text-[12px] text-muted mt-0.5">« Je cherche du riz en gros pas cher »</span></span>
          <span className="text-muted text-xl">›</span>
        </Link>

        <h2 className="px-5 mt-8 h-display text-lg">Catégories</h2>
        <div className="px-5 mt-4 grid grid-cols-4 gap-x-3 gap-y-5">
          {filtres.map(({ id: c }) => (
            <button key={c} type="button" onClick={() => { setFiltre(c); document.getElementById('boutiques')?.scrollIntoView({ behavior: 'smooth' }) }} aria-pressed={filtre === c} className="flex flex-col items-center gap-2">
              <GlassIcon cat={c} size={56} actif={filtre === c} />
              <span className={'text-[11px] text-center leading-tight ' + (filtre === c ? 'font-bold text-ink' : 'text-muted')}>{c}</span>
            </button>
          ))}
        </div>

        <div id="boutiques" className="px-5 mt-10 scroll-mt-4 flex items-end justify-between"><h2 className="h-display text-lg">{filtre === 'Tout' ? 'Toutes les boutiques' : filtre}</h2><span className="text-xs text-muted">{liste.length} trouvée{liste.length > 1 ? 's' : ''}</span></div>
        {filtre === 'Pour toi' && <p className="px-5 mt-2 text-[12px] text-[#137A52] font-semibold">✦ Choisies par l'IA selon ce que tu cherches et regardes</p>}
        <div className="px-5 mt-4 grid grid-cols-2 gap-3.5">
          {liste.map(b => <CarteBoutique key={b.id} b={b} />)}
          {!liste.length && <p className="col-span-2 text-sm text-muted">{filtre === 'Favoris' ? 'Aucun favori. Touche « Ajouter aux favoris » sur une boutique.' : 'Aucune boutique ici pour le moment.'}</p>}
        </div>

        <div className="px-5 mt-10 flex items-end justify-between"><h2 className="h-display text-lg">Repères du marché</h2><span className="text-[11px] text-muted">positions approx.</span></div>
        <div className="px-5 mt-4 flex flex-col gap-3">
          {LIEUX_UTILES.map(l => (
            <Link key={l.id} to={'/guidage/' + l.id} className="bg-white border border-line rounded-[20px] p-3 flex items-center gap-3.5 no-underline text-ink">
              <GlassIcon cat={l.type} size={44} />
              <span className="flex-1 min-w-0"><span className="block font-semibold text-[14px] truncate">{l.nom}</span><span className="block text-[12px] text-muted truncate mt-0.5">{l.note}</span></span>
              <span className="text-muted text-lg pr-1">›</span>
            </Link>
          ))}
        </div>
      </div>
    </Screen>
  )
}

export function Liste() {
  const { liste, setListe, budget, setBudget, boutiques, listes, listeActive, setListeId, nouvelleListe, supprimerListe, renommerListe } = useApp()
  const [nouveau, setNouveau] = useState('')
  const [creation, setCreation] = useState(false)
  const [nomListe, setNomListe] = useState('')
  const [renomme, setRenomme] = useState(false)
  const [edition, setEdition] = useState(null) // id de l'article en cours de modification
  const { depense, reste } = bilan(liste, budget)
  const pct = Math.max(0, Math.min(100, Math.round((depense / Math.max(budget, 1)) * 100)))
  const ajouter = e => {
    e.preventDefault()
    const nom = nouveau.trim()
    if (!nom) return
    setListe(l => [...(l || []), { id: Date.now(), nom: nom.charAt(0).toUpperCase() + nom.slice(1), prix: null, fait: false }]); setNouveau('')
  }
  const maj = (id, patch) => setListe(l => l.map(x => (x.id === id ? { ...x, ...patch } : x)))
  const retirer = id => setListe(l => l.filter(x => x.id !== id))
  return (
    <Screen nav>
      <TopBar title="Mes listes" sub={`${liste.filter(x => x.fait).length} sur ${liste.length} trouvés`} back={false}
        right={<button type="button" onClick={() => setCreation(c => !c)} className="h-10 px-3.5 rounded-full bg-white border border-line text-ink text-[13px] font-semibold flex items-center gap-1"><Icon d={I.plus} size={16} />Nouvelle liste</button>} />
      <div className="flex-1 min-h-0 scroll no-scrollbar pb-2">
      <div className="px-5 pb-2 flex flex-wrap gap-2 items-center">
        {listes.map(l => (
          <button key={l.id} type="button" onClick={() => { setListeId(l.id); setRenomme(false) }} aria-pressed={listeActive?.id === l.id}
            className={'h-9 px-3.5 rounded-full text-[13px] font-semibold border ' + (listeActive?.id === l.id ? 'bg-ink text-white border-ink' : 'bg-white border-line text-ink')}>{l.nom}</button>
        ))}
      </div>
      {listeActive && !renomme && (
        <div className="px-5 pb-2 flex gap-3 text-[12px]">
          <button type="button" onClick={() => { setNomListe(listeActive.nom); setRenomme(true) }} className="text-[#137A52] font-semibold">Renommer</button>
          {liste.length > 0 && <button type="button" onClick={() => setListe([])} className="text-muted underline">Vider</button>}
          {listes.length > 1 && <button type="button" onClick={() => supprimerListe(listeActive.id)} className="text-red-700 underline">Supprimer la liste</button>}
        </div>
      )}
      {(creation || renomme) && (
        <form onSubmit={e => { e.preventDefault(); if (renomme) { renommerListe(listeActive.id, nomListe.trim() || listeActive.nom); setRenomme(false) } else { nouvelleListe(nomListe.trim() || 'Nouvelle liste'); setCreation(false) } setNomListe('') }}
          className="mx-5 mb-2 p-2.5 rounded-[18px] bg-white border border-line flex gap-2">
          <label htmlFor="nomListe" className="sr-only">Nom de la liste</label>
          <input id="nomListe" autoFocus className="field h-11 flex-1 min-w-0" placeholder="Ex. : Fête de dimanche" value={nomListe} onChange={e => setNomListe(e.target.value)} />
          <button type="submit" className="btn btn-main no-arrow h-11 px-4 text-sm">{renomme ? 'OK' : 'Créer'}</button>
        </form>
      )}
      <div className="mx-5 rounded-[22px] bg-yellow px-3 py-3 flex items-center gap-3 shadow-[0_14px_26px_-18px_rgba(168,106,0,.9)]">
        <Ring pct={pct} size={52} stroke={6} color="#176B52" track="rgba(255,255,255,.7)"><span className="text-[11px] font-bold">{pct}%</span></Ring>
        <div className="flex-1 grid grid-cols-3 gap-1 text-center">
          <label className="text-left">
            <span className="block text-[10px] text-ink/65">Budget ✎</span>
            <input inputMode="numeric" aria-label="Budget en FCFA" value={fmtMoney(budget)} onChange={e => setBudget(Number(e.target.value.replace(/\D/g, '')) || 0)}
              className="w-full bg-transparent font-bold text-[14px] outline-none border-b border-dashed border-ink/30" />
          </label>
          <div><div className="text-[10px] text-ink/65">Dépensé</div><div className="font-bold text-[14px]">{fmtMoney(depense)}</div></div>
          <div><div className="text-[10px] text-ink/65">Il reste</div><div className={'font-bold text-[14px] ' + (reste < 0 ? 'text-red-700' : 'text-[#0F5440]')}>{fmtMoney(reste)}</div></div>
        </div>
      </div>
      <form onSubmit={ajouter} className="mx-5 mt-2.5 mb-1.5 flex gap-2">
        <label htmlFor="nouvel" className="sr-only">Ajouter un article</label>
        <input id="nouvel" className="field h-[46px] flex-1 min-w-0" placeholder="Ajouter : ex. sac à main" value={nouveau} onChange={e => setNouveau(e.target.value)} />
        <button type="submit" className="btn btn-main no-arrow h-[46px] text-sm">Ajouter</button>
      </form>
      <div className="px-5 pt-2 pb-2 flex flex-col gap-3">
        {liste.map(it => {
          const sugg = suggestions(it.nom, boutiques)
          const enEdition = edition === it.id
          if (enEdition) return (
            <form key={it.id} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); maj(it.id, { nom: String(f.get('nom')).trim() || it.nom, prix: String(f.get('prix')).replace(/\D/g, '') ? Number(String(f.get('prix')).replace(/\D/g, '')) : null }); setEdition(null) }}
              className="card !shadow-none p-3 flex flex-col gap-2 border-primary">
              <div className="flex gap-2">
                <label className="flex-1 min-w-0"><span className="text-[11px] text-muted">Article</span><input name="nom" autoFocus defaultValue={it.nom} className="field h-11" /></label>
                <label className="w-28"><span className="text-[11px] text-muted">Prix (F)</span><input name="prix" inputMode="numeric" defaultValue={it.prix ?? ''} className="field h-11" /></label>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEdition(null)} className="btn btn-ghost flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" className="btn bg-ink text-white flex-1 h-10 text-sm">Enregistrer</button>
              </div>
            </form>
          )
          return (
            <div key={it.id} className="card !shadow-none px-3.5 py-3.5 flex gap-3.5 items-center">
              <button type="button" onClick={() => maj(it.id, { fait: !it.fait })} aria-pressed={it.fait} aria-label={(it.fait ? 'Décocher ' : 'Cocher ') + it.nom}
                className={'w-[28px] h-[28px] rounded-[9px] border-2 flex items-center justify-center shrink-0 ' + (it.fait ? 'bg-sun border-sun' : 'bg-white border-field')}>
                {it.fait && <Icon d={I.check} size={15} stroke="#fff" width={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className={'font-semibold truncate ' + (it.fait ? 'line-through text-muted' : '')}>{it.nom}</span>
                  <span className={'font-semibold text-sm shrink-0 ' + (it.prix ? '' : 'text-[#B9C4BE]')}>{it.prix ? fmtMoney(it.prix) + ' F' : 'prix ?'}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <span className="flex-1 truncate">{sugg.length ? `${sugg.length} boutique${sugg.length > 1 ? 's' : ''} · ${sugg[0].zone.toLowerCase()}` : 'Pas encore de boutique connue'}</span>
                  {sugg[0] && !it.fait && <Link to={'/guidage/' + sugg[0].id} className="font-semibold text-[#137A52]">Y aller</Link>}
                </div>
              </div>
              <button type="button" onClick={() => setEdition(it.id)} aria-label={'Modifier ' + it.nom} className="w-9 h-9 rounded-full bg-[#F2F4F3] text-ink flex items-center justify-center shrink-0"><Icon d={I.edit} size={16} /></button>
              <button type="button" onClick={() => retirer(it.id)} aria-label={'Supprimer ' + it.nom} className="w-9 h-9 rounded-full bg-[#F2F4F3] text-muted flex items-center justify-center shrink-0"><Icon d="M6 6l12 12M18 6L6 18" size={15} /></button>
            </div>
          )
        })}
        {!liste.length && <p className="text-sm text-muted text-center py-6">Ta liste est vide.<br />Écris ce que tu viens acheter juste au-dessus, puis « Ajouter ».</p>}
        
      </div>
      </div>
      <Link to="/assistant" className="btn bg-white border border-line mx-5 mt-3 mb-3 h-[52px] text-[14px] pl-1.5 justify-start gap-3"><span className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center"><MicIcon size={18} /></span>Parler à l'assistant</Link>
    </Screen>
  )
}

export function Assistant() {
  const nav = useNavigate()
  const { liste, setListe, budget, boutiques, dire, moi, coeursDe } = useApp()
  const [messages, setMessages] = useState([{ de: 'ia', texte: 'Dis-moi ce que tu as trouvé, ce que tu veux ajouter, ou demande-moi combien il te reste.' }])
  const [texte, setTexte] = useState('')
  const [ecoute, setEcoute] = useState(false)
  const traiter = async phrase => {
    if (!phrase.trim()) return
    setTexte('')
    setMessages(m => [...m, { de: 'moi', texte: phrase }])
    // Gemini d'abord ; IA locale si pas de réseau. « Si je prends… » reste un calcul local exact.
    const ia = /si je prends/i.test(phrase) ? null : await demanderIA({ message: phrase, boutiques, lieux: LIEUX_UTILES, position: moi, liste, budget, coeursDe, historique: messages })
    let texteIA, boutique, nouvelle
    if (ia) {
      nouvelle = appliquerOperations(liste, ia.operations)
      texteIA = ia.reponse + (ia.parler_budget || ia.operations.some(o => o.type === 'cocher') ? ' ' + phraseBudget(nouvelle, budget) : '')
      boutique = ia.boutiques.map(id => boutiques.find(b => b.id === id)).find(Boolean)
    } else {
      const r = assistantListe(phrase, liste, budget, boutiques)
      nouvelle = r.liste; texteIA = r.reponse; boutique = r.boutique
    }
    setListe(nouvelle)
    setMessages(m => [...m, { de: 'ia', texte: texteIA, boutique, source: ia ? 'Gemini' : 'IA locale' }])
    dire(texteIA)
  }
  const micro = async () => {
    setEcoute(true)
    try { traiter(await ecouter()) } catch (e) { setMessages(m => [...m, { de: 'ia', texte: 'Micro indisponible (' + e.message + '). Écris ta phrase.' }]) } finally { setEcoute(false) }
  }
  return (
    <Screen>
      <TopBar title="Ma liste · assistant" back="/liste" />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 py-3 flex flex-col gap-4">
        {messages.map((m, i) => m.de === 'moi'
          ? <div key={i} className="self-end max-w-[290px] bg-ink text-white rounded-[18px] rounded-br-sm px-3.5 py-3 text-[15px] leading-snug">{m.texte}</div>
          : (
            <div key={i} className="self-start max-w-[310px] card rounded-bl-sm px-3.5 py-3 text-[15px] leading-snug">
              {m.texte}
              {m.source && <span className={'block w-fit mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ' + (m.source === 'Gemini' ? 'bg-[#E6F4EC] text-[#137A52]' : 'bg-[#F4F4F7] text-muted')}>{m.source === 'Gemini' ? '✦ Gemini' : 'IA locale (hors ligne)'}</span>}
              {m.boutique && (
                <div className="mt-2.5 flex gap-2">
                  <button type="button" onClick={() => nav('/guidage/' + m.boutique.id)} className="btn btn-main h-10 text-[13px]">Aller à {m.boutique.categorie.toLowerCase()}</button>
                  <button type="button" onClick={() => nav('/liste')} className="btn btn-ghost h-10 text-[13px]">Voir ma liste</button>
                </div>
              )}
            </div>
          ))}
      </div>
      <div className="px-5 pt-2 flex gap-2 flex-wrap">
        {["J'ai trouvé les chaussures à 8 000", 'Ajoute du savon', 'Combien il me reste ?'].map(p => (
          <button key={p} type="button" onClick={() => traiter(p)} className="h-9 px-3 rounded-full bg-white border border-line text-[12px] font-semibold">{p}</button>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); traiter(texte) }} className="px-5 pt-2 flex gap-2">
        <label htmlFor="phrase" className="sr-only">Ta phrase</label>
        <input id="phrase" className="field h-[46px] flex-1 min-w-0" placeholder="ex. : j'ai trouvé le sac à 12 000" value={texte} onChange={e => setTexte(e.target.value)} />
        <button type="submit" className="btn btn-sun h-[46px] text-sm font-bold">Envoyer</button>
      </form>
      <div className="flex flex-col items-center gap-2 pt-3 pb-5">
        <button type="button" onClick={micro} disabled={!microDisponible() || ecoute} aria-label="Parler à l'assistant"
          className={'w-[72px] h-[72px] rounded-full bg-sun text-ink flex items-center justify-center shadow-[0_0_0_10px_rgba(245,166,35,.4)] ' + (ecoute ? 'animate-pulse' : '')}>
          <MicIcon size={30} />
        </button>
        <div className="text-[13px] text-muted text-center px-6">Dis « j'ai trouvé… », « ajoute… » ou « combien il me reste ? »</div>
      </div>
    </Screen>
  )
}

export function Missions() {
  const { missions: mA, setMissions: setA, missionsVendeur, setMissionsVendeur, points: pA, user } = useApp()
  const vendeur = user?.role === 'vendeur'
  const missions = vendeur ? missionsVendeur : mA
  const setMissions = vendeur ? setMissionsVendeur : setA
  const points = vendeur ? missionsVendeur.filter(m => m.fait).reduce((t, m) => t + m.points, 0) : pA
  const niveau = Math.floor(points / 100) + 1
  return (
    <Screen nav>
      <TopBar title={vendeur ? 'Missions vendeur' : 'Missions'} sub={vendeur ? 'Rends ta boutique plus visible' : "Aide à dessiner la carte d'Asigamé"} back={vendeur ? '/vendeur' : false} />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pt-1 pb-6 flex flex-col gap-3.5">
<div className="relative overflow-hidden bg-lilac text-ink rounded-[28px] p-6 shadow-[0_18px_30px_-18px_rgba(90,63,214,.8)]">
        <div className="relative text-[11px] font-bold uppercase tracking-wider text-ink/70">Défi du jour</div>
        <div className="relative h-display text-[26px] leading-tight mt-1">{points} points</div>
        <div className="relative text-[12px] text-ink/70">{vendeur ? 'Vendeur·se' : 'Explorateur·rice'} · niveau {niveau} · encore {niveau * 100 - points} pts</div>
        <div className="relative h-2 rounded-full bg-white/60 mt-3"><div className="h-2 rounded-full bg-ink" style={{ width: (points % 100) + '%' }} /></div>
      </div>
        <div className="section-title mt-3">Missions du jour</div>
        {missions.map(m => (
          <button key={m.id} type="button" onClick={() => setMissions(ms => ms.map(x => (x.id === m.id ? { ...x, fait: !x.fait } : x)))}
            className="card p-4 flex items-center gap-3.5 text-left">
            <span className={'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ' + (m.fait ? 'bg-sun border-sun' : 'border-field bg-white')}>
              {m.fait && <Icon d={I.check} size={15} stroke="#16181D" width={3} />}
            </span>
            <span className="tile w-11 h-11 rounded-[14px]">
              <Icon d={I.star} size={20} stroke={['#5A3FD6', '#A86A00', '#2457D6', '#B02E8F', '#137A52'][missions.indexOf(m) % 5]} />
            </span>
            <span className="flex-1"><b className="block text-sm">{m.titre}</b><span className="text-xs text-muted">{m.fait ? 'Fait' : m.detail}</span></span>
            <span className={'font-bold text-sm ' + (m.fait ? 'text-muted line-through' : 'text-ink')}>+{m.points}</span>
          </button>
        ))}
        <div className="bg-sky-soft rounded-[14px] px-3.5 py-3 text-[13px] text-muted leading-snug">Chaque trajet que tu enregistres aide à tracer les allées du marché. Plus on marche, plus la carte devient précise.</div>
      </div>
    </Screen>
  )
}

// « 22890112201 » ou « 90112201 » → « +228 90112201 »
const numero = tel => { const d = String(tel || '').replace(/\D/g, ''); return d ? '+228 ' + (d.length > 8 && d.startsWith('228') ? d.slice(3) : d) : '' }

export function Profil() {
  const nav = useNavigate()
  const { user, setUser, langue, setLangue, historique, favoris, boutique, points, seDeconnecter } = useApp()
  // Déconnexion : fin de la session, données du compte effacées du téléphone, retour à l'écran Bienvenue
  const deconnexion = async () => { await seDeconnecter(); nav('/bienvenue', { replace: true }) }
  return (
    <Screen nav>
      <div className="px-5 pt-5 pb-3.5 flex items-center gap-3.5">
        <div className="w-[60px] h-[60px] rounded-full bg-peach text-ink flex items-center justify-center font-display font-bold text-2xl">
          {user?.prenom ? user.prenom[0].toUpperCase() : <UserIcon />}
        </div>
        <div className="flex-1">
          <div className="font-display text-[22px] font-bold">{user?.prenom || 'Invité·e'}</div>
          <div className="text-[13px] text-muted">{user ? (user.email || numero(user.tel)) + ' · ' + (user.role === 'vendeur' ? 'Vendeur·se' : 'Acheteur·se') : 'Sans compte'}</div>
        </div>
      </div>
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-6 flex flex-col gap-4">
        {!user && <Link to="/inscription" className="btn btn-main h-12">Créer un compte</Link>}
        {user?.role !== 'vendeur' ? (
          <button type="button" onClick={() => { setUser({ ...(user || { prenom: '', tel: '' }), role: 'vendeur' }); nav('/vendeur') }}
            className="relative overflow-hidden bg-pink text-ink rounded-[24px] px-4 py-4 flex items-center gap-3 text-left">
            <span className="tile w-12 h-12 rounded-2xl"><Icon d={I.shop} size={24} stroke="#B02E8F" /></span>
            <span className="flex-1"><b className="block text-[15px]">Tu vends au marché ?</b><span className="text-xs text-ink/70">Ouvre ton espace vendeur. Tu gardes la navigation.</span></span>
            <Icon d={I.chevron} size={20} />
          </button>
        ) : <Link to="/vendeur" className="btn bg-ink text-white h-12">Mon espace vendeur</Link>}
        <Link to="/missions" className="card px-3.5 py-3 flex items-center no-underline text-ink"><b className="flex-1 text-sm">Mes missions · {points} points</b><Icon d={I.chevron} size={18} stroke="#5B605C" /></Link>
        <div className="section-title">Mes trajets</div>
        <div className="card">
          {historique.length ? historique.slice(0, 4).map(h => (
            <div key={h.id} className="px-4 py-4 flex justify-between items-center border-b border-[#F3EDE0] last:border-0 text-sm">
              <span><b>{new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</b><span className="block text-xs text-muted">{fmtDist(h.longueur)} · {h.points.length} points</span></span>
            </div>
          )) : <p className="px-3.5 py-3 text-sm text-muted">Aucun trajet pour l'instant.</p>}
        </div>
        <div className="section-title">Mes boutiques favorites</div>
        {favoris.map(id => boutique(id)).filter(Boolean).map(b => (
          <Link key={b.id} to={'/boutique/' + b.id} className="card px-3.5 py-3 flex items-center gap-3 no-underline text-ink">
            <Wax image={b.couverture} className="w-12 h-12 rounded-[14px] shrink-0" /><span className="flex-1"><b className="block text-sm">{b.nom}</b><span className="text-xs text-muted">{b.categorie}</span></span>
          </Link>
        ))}
        <Link to="/test-ia" className="card px-4 py-3.5 flex items-center gap-3 no-underline text-ink">
          <span className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-[15px]">✦</span>
          <span className="flex-1"><b className="block text-sm">Tester l'IA (Gemini)</b><span className="text-xs text-muted">Vérifie que la clé marche</span></span>
          <Icon d={I.chevron} size={18} />
        </Link>
        <div className="section-title">Réglages</div>
        <div className="card">
          <div className="border-b border-[#F3EDE0]"><EtatServeur /></div>
          <label className="px-4 py-4 flex justify-between items-center border-b border-[#F3EDE0] text-sm">
            <span>Langue de la voix</span>
            <select value={langue} onChange={e => setLangue(e.target.value)} className="font-semibold bg-transparent">
              <option value="ewe">Éwé</option><option value="mina">Mina</option><option value="fr">Français</option>
            </select>
          </label>
          {user && <button type="button" onClick={deconnexion} className="w-full text-left px-3.5 py-3 text-sm font-semibold text-red-700">Se déconnecter</button>}
        </div>
      </div>
    </Screen>
  )
}
