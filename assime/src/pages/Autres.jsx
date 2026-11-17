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
import { voixDe } from '../i18n'
import { ChoixLangue } from './Entree'

/** Petit cercle qui tourne (chargement) */
export const Rouage = ({ className = '' }) => (
  <span aria-hidden="true" className={'inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin ' + className} />
)

/** Bulle « L'IA réfléchit… » affichée tout de suite sous le message envoyé */
export function Reflexion() {
  const { t } = useApp()
  return (
    <div className="self-start bg-white border border-line rounded-[20px] rounded-bl-md px-4 py-3 text-[14px] text-muted flex items-center gap-2.5" role="status">
      <Rouage className="text-brand" />{t('ia.reflechit')}
    </div>
  )
}

/** Puce de phrase rapide : verte avec un rouage quand c'est elle qu'on vient de toucher, toutes bloquées pendant la réponse */
export function Puce({ texte, active, bloque, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={bloque} aria-pressed={active} aria-busy={active || undefined}
      className={'h-9 px-3.5 rounded-full text-[12px] font-semibold shrink-0 flex items-center gap-1.5 border transition-colors '
        + (active ? 'bg-brand border-brand text-white' : bloque ? 'bg-white border-line text-ink/40' : 'bg-white border-line text-ink')}>
      {active && <Rouage />}{texte}
    </button>
  )
}

function CarteBoutique({ b, large = false }) {
  const { favoris, coeursDe, t, tc } = useApp()
  const prix = Math.min(...(b.articles || []).filter(a => a.prix).map(a => a.prix), Infinity)
  return (
    <Link to={'/boutique/' + b.id} className={'bg-white rounded-[22px] p-2 border border-line no-underline text-ink shrink-0 ' + (large ? 'w-[168px]' : '')}>
      <Wax image={b.couverture} className="h-[96px] rounded-[16px]">
        {b.verifiee && <span className="absolute left-2 top-2 px-2 py-0.5 rounded-full bg-white text-ink text-[10px] font-bold">{t('explorer.verifiee')}</span>}
        {favoris.includes(b.id) && <span className="absolute right-2 top-2 text-[#E5484D]"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={I.heart} /></svg></span>}
        {coeursDe(b.id).affiches > 0 && <Coeurs n={coeursDe(b.id).affiches} className="absolute left-2 bottom-2" />}
      </Wax>
      <div className="px-2 pt-3 pb-2">
        <div className="text-[14px] font-semibold leading-snug line-clamp-2 min-h-[38px]">{b.nom}</div>
        <div className="text-[12px] text-muted mt-1.5">{isFinite(prix) ? t('commun.des', { prix: fmtMoney(prix) }) : tc(b.categorie)}{b.gros ? ' · ' + t('commun.gros') : ''}</div>
      </div>
    </Link>
  )
}

export function Explorer() {
  const { boutiques, user, favoris, coeursDe, interets, t, tc, lieuTraduit } = useApp()
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
            <div className="text-[13px] text-muted">{t('explorer.salut', { nom: user?.prenom || '' })}</div>
            <h1 className="h-display text-[30px] leading-[1.1] mt-1">{t('explorer.titre')}</h1>
          </div>
          <Link to="/recherche" aria-label={t('explorer.rechercher')} className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center text-ink"><Icon><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Icon></Link>
        </div>

        <button type="button" onClick={voirZone} className="mx-5 mt-6 w-[calc(100%-40px)] rounded-[28px] bg-lilac p-6 text-left shadow-[0_18px_30px_-18px_rgba(90,63,214,.8)]">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-ink/70">{t('explorer.zone')}</span>
          <span className="block h-display text-[26px] leading-[1.1] mt-2 text-ink">{t('zone.' + zone.id) === 'zone.' + zone.id ? zone.nom : t('zone.' + zone.id)}</span>
          <span className="block text-[13px] text-ink/70 mt-2">{t('explorer.zoneInfo', { min: zone.distanceMin, n: boutiques.filter(b => b.categorie === zone.categorie).length })}</span>
          <span className="mt-4 inline-flex h-10 pl-4 pr-1 rounded-full bg-ink text-white text-[13px] font-semibold items-center gap-2">{t('commun.yAller')}<span className="w-8 h-8 rounded-full bg-white text-ink flex items-center justify-center text-base">›</span></span>
        </button>

        <Link to="/ia" className="mx-5 mt-4 rounded-[24px] bg-white border border-line p-4 flex items-center gap-3.5 no-underline text-ink">
          <span className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shrink-0"><MicIcon size={22} /></span>
          <span className="flex-1"><b className="block text-[15px]">{t('explorer.parlerIA')}</b><span className="block text-[12px] text-muted mt-0.5">{t('explorer.exemple')}</span></span>
          <span className="text-muted text-xl">›</span>
        </Link>

        <h2 className="px-5 mt-8 h-display text-lg">{t('explorer.categories')}</h2>
        <div className="px-5 mt-4 grid grid-cols-4 gap-x-3 gap-y-5">
          {filtres.map(({ id: c }) => (
            <button key={c} type="button" onClick={() => { setFiltre(c); document.getElementById('boutiques')?.scrollIntoView({ behavior: 'smooth' }) }} aria-pressed={filtre === c} className="flex flex-col items-center gap-2">
              <GlassIcon cat={c} size={56} actif={filtre === c} />
              <span className={'text-[11px] text-center leading-tight ' + (filtre === c ? 'font-bold text-ink' : 'text-muted')}>{tc(c)}</span>
            </button>
          ))}
        </div>

        <div id="boutiques" className="px-5 mt-10 scroll-mt-4 flex items-end justify-between"><h2 className="h-display text-lg">{filtre === 'Tout' ? t('explorer.toutes') : tc(filtre)}</h2><span className="text-xs text-muted">{t('explorer.trouvees', { n: liste.length })}</span></div>
        {filtre === 'Pour toi' && <p className="px-5 mt-2 text-[12px] text-[#137A52] font-semibold">{t('explorer.pourToi')}</p>}
        <div className="px-5 mt-4 grid grid-cols-2 gap-3.5">
          {liste.map(b => <CarteBoutique key={b.id} b={b} />)}
          {!liste.length && <p className="col-span-2 text-sm text-muted">{filtre === 'Favoris' ? t('explorer.aucunFavori') : t('explorer.aucune')}</p>}
        </div>

        <div className="px-5 mt-10 flex items-end justify-between"><h2 className="h-display text-lg">{t('explorer.reperes')}</h2><span className="text-[11px] text-muted">{t('explorer.approx')}</span></div>
        <div className="px-5 mt-4 flex flex-col gap-3">
          {LIEUX_UTILES.map(lieuTraduit).map(l => (
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
  const { liste, setListe, budget, setBudget, boutiques, listes, listeActive, setListeId, nouvelleListe, supprimerListe, renommerListe, t, zoneDe } = useApp()
  const [nouveau, setNouveau] = useState('')
  const [creation, setCreation] = useState(false)
  const [nomListe, setNomListe] = useState('')
  const [renomme, setRenomme] = useState(false)
  const [edition, setEdition] = useState(null) // id de l'article en cours de modification
  const { depense, reste } = bilan(liste, budget)
  const pct = Math.max(0, Math.min(100, Math.round((depense / Math.max(budget, 1)) * 100)))
  // Noms par défaut créés par l'app : affichés dans la langue choisie
  const nomDe = l => (l.nom === 'Ma liste' ? t('liste.maListe') : l.nom === 'Nouvelle liste' ? t('liste.nouvelle')
    : l.nom === 'Marché de samedi (démo)' && t('liste.demo') !== 'liste.demo' ? t('liste.demo') : l.nom)
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
      <TopBar title={t('liste.titre')} sub={t('liste.sous', { f: liste.filter(x => x.fait).length, n: liste.length })} back={false}
        right={<button type="button" onClick={() => setCreation(c => !c)} className="h-10 px-3.5 rounded-full bg-white border border-line text-ink text-[13px] font-semibold flex items-center gap-1"><Icon d={I.plus} size={16} />{t('liste.nouvelle')}</button>} />
      <div className="flex-1 min-h-0 scroll no-scrollbar pb-2">
      <div className="px-5 pb-2 flex flex-wrap gap-2 items-center">
        {listes.map(l => (
          <button key={l.id} type="button" onClick={() => { setListeId(l.id); setRenomme(false) }} aria-pressed={listeActive?.id === l.id}
            className={'h-9 px-3.5 rounded-full text-[13px] font-semibold border ' + (listeActive?.id === l.id ? 'bg-ink text-white border-ink' : 'bg-white border-line text-ink')}>{nomDe(l)}</button>
        ))}
      </div>
      {listeActive && !renomme && (
        <div className="px-5 pb-2 flex gap-3 text-[12px]">
          <button type="button" onClick={() => { setNomListe(nomDe(listeActive)); setRenomme(true) }} className="text-[#137A52] font-semibold">{t('liste.renommer')}</button>
          {liste.length > 0 && <button type="button" onClick={() => setListe([])} className="text-muted underline">{t('liste.vider')}</button>}
          {listes.length > 1 && <button type="button" onClick={() => supprimerListe(listeActive.id)} className="text-red-700 underline">{t('liste.supprimer')}</button>}
        </div>
      )}
      {(creation || renomme) && (
        <form onSubmit={e => { e.preventDefault(); if (renomme) { renommerListe(listeActive.id, nomListe.trim() || listeActive.nom); setRenomme(false) } else { nouvelleListe(nomListe.trim() || t('liste.nouvelle')); setCreation(false) } setNomListe('') }}
          className="mx-5 mb-2 p-2.5 rounded-[18px] bg-white border border-line flex gap-2">
          <label htmlFor="nomListe" className="sr-only">{t('liste.nomLabel')}</label>
          <input id="nomListe" autoFocus className="field h-11 flex-1 min-w-0" placeholder={t('liste.nomPh')} value={nomListe} onChange={e => setNomListe(e.target.value)} />
          <button type="submit" className="btn btn-main no-arrow h-11 px-4 text-sm">{renomme ? t('commun.valider') : t('commun.creer')}</button>
        </form>
      )}
      <div className="mx-5 rounded-[22px] bg-yellow px-3 py-3 flex items-center gap-3 shadow-[0_14px_26px_-18px_rgba(168,106,0,.9)]">
        <Ring pct={pct} size={52} stroke={6} color="#176B52" track="rgba(255,255,255,.7)"><span className="text-[11px] font-bold">{pct}%</span></Ring>
        <div className="flex-1 grid grid-cols-3 gap-1 text-center">
          <label className="text-left">
            <span className="block text-[10px] text-ink/65">{t('liste.budget')}</span>
            <input inputMode="numeric" aria-label={t('liste.budgetAria')} value={fmtMoney(budget)} onChange={e => setBudget(Number(e.target.value.replace(/\D/g, '')) || 0)}
              className="w-full bg-transparent font-bold text-[14px] outline-none border-b border-dashed border-ink/30" />
          </label>
          <div><div className="text-[10px] text-ink/65">{t('liste.depense')}</div><div className="font-bold text-[14px]">{fmtMoney(depense)}</div></div>
          <div><div className="text-[10px] text-ink/65">{t('liste.reste')}</div><div className={'font-bold text-[14px] ' + (reste < 0 ? 'text-red-700' : 'text-[#0F5440]')}>{fmtMoney(reste)}</div></div>
        </div>
      </div>
      <form onSubmit={ajouter} className="mx-5 mt-2.5 mb-1.5 flex gap-2">
        <label htmlFor="nouvel" className="sr-only">{t('liste.ajouterLabel')}</label>
        <input id="nouvel" className="field h-[46px] flex-1 min-w-0" placeholder={t('liste.ajouterPh')} value={nouveau} onChange={e => setNouveau(e.target.value)} />
        <button type="submit" className="btn btn-main no-arrow h-[46px] text-sm">{t('commun.ajouter')}</button>
      </form>
      <div className="px-5 pt-2 pb-2 flex flex-col gap-3">
        {liste.map(it => {
          const sugg = suggestions(it.nom, boutiques)
          const enEdition = edition === it.id
          if (enEdition) return (
            <form key={it.id} onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); maj(it.id, { nom: String(f.get('nom')).trim() || it.nom, prix: String(f.get('prix')).replace(/\D/g, '') ? Number(String(f.get('prix')).replace(/\D/g, '')) : null }); setEdition(null) }}
              className="card !shadow-none p-3 flex flex-col gap-2 border-primary">
              <div className="flex gap-2">
                <label className="flex-1 min-w-0"><span className="text-[11px] text-muted">{t('liste.article')}</span><input name="nom" autoFocus defaultValue={it.nom} className="field h-11" /></label>
                <label className="w-28"><span className="text-[11px] text-muted">{t('liste.prix')}</span><input name="prix" inputMode="numeric" defaultValue={it.prix ?? ''} className="field h-11" /></label>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEdition(null)} className="btn btn-ghost flex-1 h-10 text-sm">{t('commun.annuler')}</button>
                <button type="submit" className="btn bg-ink text-white flex-1 h-10 text-sm">{t('commun.enregistrer')}</button>
              </div>
            </form>
          )
          return (
            <div key={it.id} className="card !shadow-none px-3.5 py-3.5 flex gap-3.5 items-center">
              <button type="button" onClick={() => maj(it.id, { fait: !it.fait })} aria-pressed={it.fait} aria-label={t(it.fait ? 'liste.decocher' : 'liste.cocher', { nom: it.nom })}
                className={'w-[28px] h-[28px] rounded-[9px] border-2 flex items-center justify-center shrink-0 ' + (it.fait ? 'bg-sun border-sun' : 'bg-white border-field')}>
                {it.fait && <Icon d={I.check} size={15} stroke="#fff" width={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className={'font-semibold truncate ' + (it.fait ? 'line-through text-muted' : '')}>{it.nom}</span>
                  <span className={'font-semibold text-sm shrink-0 ' + (it.prix ? '' : 'text-[#B9C4BE]')}>{it.prix ? fmtMoney(it.prix) + ' F' : t('liste.prixInconnu')}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <span className="flex-1 truncate">{sugg.length ? t('liste.sugg', { n: sugg.length, zone: zoneDe(sugg[0]).toLowerCase() }) : t('liste.aucuneSugg')}</span>
                  {sugg[0] && !it.fait && <Link to={'/guidage/' + sugg[0].id} className="font-semibold text-[#137A52]">{t('commun.yAller')}</Link>}
                </div>
              </div>
              <button type="button" onClick={() => setEdition(it.id)} aria-label={t('commun.modifierNom', { nom: it.nom })} className="w-9 h-9 rounded-full bg-[#F2F4F3] text-ink flex items-center justify-center shrink-0"><Icon d={I.edit} size={16} /></button>
              <button type="button" onClick={() => retirer(it.id)} aria-label={t('commun.supprimerNom', { nom: it.nom })} className="w-9 h-9 rounded-full bg-[#F2F4F3] text-muted flex items-center justify-center shrink-0"><Icon d="M6 6l12 12M18 6L6 18" size={15} /></button>
            </div>
          )
        })}
        {!liste.length && <p className="text-sm text-muted text-center py-6">{t('liste.vide1')}<br />{t('liste.vide2')}</p>}
      </div>
      </div>
      <Link to="/assistant" className="btn bg-white border border-line mx-5 mt-3 mb-3 h-[52px] text-[14px] pl-1.5 justify-start gap-3"><span className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center"><MicIcon size={18} /></span>{t('liste.assistant')}</Link>
    </Screen>
  )
}

export function Assistant() {
  const nav = useNavigate()
  const { liste, setListe, budget, boutiques, dire, moi, coeursDe, langue, t, tc } = useApp()
  const [messages, setMessages] = useState([{ de: 'ia', cle: 'assistant.accueil' }])
  const [texte, setTexte] = useState('')
  const [ecoute, setEcoute] = useState(false)
  const [occupe, setOccupe] = useState(false) // l'IA prépare sa réponse
  const [puce, setPuce] = useState(null) // phrase rapide touchée
  const traiter = async (phrase, depuisPuce = null) => {
    if (!phrase.trim() || occupe) return
    setTexte(''); setOccupe(true); setPuce(depuisPuce)
    setMessages(m => [...m, { de: 'moi', texte: phrase }])
    try {
      // IA en ligne d'abord ; IA locale si pas de réseau. « Si je prends… » reste un calcul local exact.
      const ia = /si je prends|if i (take|buy)/i.test(phrase) ? null
        : await demanderIA({ message: phrase, boutiques, lieux: LIEUX_UTILES, position: moi, liste, budget, coeursDe, historique: messages.filter(m => m.texte), langue })
      let texteIA, boutique, nouvelle
      if (ia) {
        nouvelle = appliquerOperations(liste, ia.operations)
        texteIA = ia.reponse + (ia.parler_budget || ia.operations.some(o => o.type === 'cocher') ? ' ' + phraseBudget(nouvelle, budget, langue) : '')
        boutique = ia.boutiques.map(id => boutiques.find(b => b.id === id)).find(Boolean)
      } else {
        const r = assistantListe(phrase, liste, budget, boutiques, langue)
        nouvelle = r.liste; texteIA = r.reponse; boutique = r.boutique
      }
      setListe(nouvelle)
      setMessages(m => [...m, { de: 'ia', texte: texteIA, boutique, source: ia ? 'en ligne' : 'hors ligne' }])
      dire(texteIA)
    } finally { setOccupe(false); setPuce(null) }
  }
  const micro = async () => {
    setEcoute(true)
    let phrase = null
    try { phrase = await ecouter(voixDe(langue)) } catch (e) { console.error('[Assimé] micro', e); setMessages(m => [...m, { de: 'ia', cle: 'assistant.micro' }]) } finally { setEcoute(false) }
    if (phrase) traiter(phrase)
  }
  const puces = ['assistant.c1', 'assistant.c2', 'assistant.c3']
  return (
    <Screen>
      <TopBar title={t('assistant.titre')} back="/liste" />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 py-3 flex flex-col gap-4">
        {messages.map((m, i) => m.de === 'moi'
          ? <div key={i} className="self-end max-w-[290px] bg-ink text-white rounded-[18px] rounded-br-sm px-3.5 py-3 text-[15px] leading-snug">{m.texte}</div>
          : (
            <div key={i} className="self-start max-w-[310px] card rounded-bl-sm px-3.5 py-3 text-[15px] leading-snug">
              {m.cle ? t(m.cle) : m.texte}
              {m.source && <span className={'block w-fit mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ' + (m.source === 'en ligne' ? 'bg-[#E6F4EC] text-[#137A52]' : 'bg-[#F4F4F7] text-muted')}>{m.source === 'en ligne' ? t('ia.enLigne') : t('ia.horsLigne')}</span>}
              {m.boutique && (
                <div className="mt-2.5 flex gap-2">
                  <button type="button" onClick={() => nav('/guidage/' + m.boutique.id)} className="btn btn-main h-10 text-[13px]">{t('assistant.allerA', { cat: tc(m.boutique.categorie).toLowerCase() })}</button>
                  <button type="button" onClick={() => nav('/liste')} className="btn btn-ghost h-10 text-[13px]">{t('ia.voirListe')}</button>
                </div>
              )}
            </div>
          ))}
        {occupe && <Reflexion />}
      </div>
      <div className="px-5 pt-2 flex gap-2 flex-wrap">
        {puces.map(c => <Puce key={c} texte={t(c)} active={puce === c} bloque={occupe || ecoute} onClick={() => traiter(t(c), c)} />)}
      </div>
      <form onSubmit={e => { e.preventDefault(); traiter(texte) }} className="px-5 pt-2 flex gap-2">
        <label htmlFor="phrase" className="sr-only">{t('assistant.phrase')}</label>
        <input id="phrase" className="field h-[46px] flex-1 min-w-0" placeholder={t('assistant.placeholder')} value={texte} onChange={e => setTexte(e.target.value)} />
        <button type="submit" disabled={occupe || !texte.trim()} className="btn btn-sun h-[46px] text-sm font-bold">{t('ia.envoyer')}</button>
      </form>
      <div className="flex flex-col items-center gap-2 pt-3 pb-5">
        <button type="button" onClick={micro} disabled={!microDisponible() || ecoute || occupe} aria-label={t('liste.assistant')}
          className={'w-[72px] h-[72px] rounded-full bg-sun text-ink flex items-center justify-center shadow-[0_0_0_10px_rgba(245,166,35,.4)] disabled:opacity-50 ' + (ecoute ? 'animate-pulse' : '')}>
          <MicIcon size={30} />
        </button>
        <div className="text-[13px] text-muted text-center px-6">{t('assistant.aide')}</div>
      </div>
    </Screen>
  )
}

export function Missions() {
  const { missions: mA, setMissions: setA, missionsVendeur, setMissionsVendeur, points: pA, user, t } = useApp()
  const vendeur = user?.role === 'vendeur'
  const missions = vendeur ? missionsVendeur : mA
  const setMissions = vendeur ? setMissionsVendeur : setA
  const points = vendeur ? missionsVendeur.filter(m => m.fait).reduce((s, m) => s + m.points, 0) : pA
  const niveau = Math.floor(points / 100) + 1
  const champ = (m, k) => { const cle = 'mission.' + m.id + '.' + k; const x = t(cle); return x === cle ? m[k] : x }
  return (
    <Screen nav>
      <TopBar title={vendeur ? t('missions.titreVendeur') : t('missions.titre')} sub={vendeur ? t('missions.sousVendeur') : t('missions.sous')} back={vendeur ? '/vendeur' : false} />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pt-1 pb-6 flex flex-col gap-3.5">
<div className="relative overflow-hidden bg-lilac text-ink rounded-[28px] p-6 shadow-[0_18px_30px_-18px_rgba(90,63,214,.8)]">
        <div className="relative text-[11px] font-bold uppercase tracking-wider text-ink/70">{t('missions.defi')}</div>
        <div className="relative h-display text-[26px] leading-tight mt-1">{t('missions.points', { n: points })}</div>
        <div className="relative text-[12px] text-ink/70">{vendeur ? t('missions.vendeur') : t('missions.explorateur')} · {t('missions.niveau', { niveau, reste: niveau * 100 - points })}</div>
        <div className="relative h-2 rounded-full bg-white/60 mt-3"><div className="h-2 rounded-full bg-ink" style={{ width: (points % 100) + '%' }} /></div>
      </div>
        <div className="section-title mt-3">{t('missions.duJour')}</div>
        {missions.map(m => (
          <button key={m.id} type="button" onClick={() => setMissions(ms => ms.map(x => (x.id === m.id ? { ...x, fait: !x.fait } : x)))}
            className="card p-4 flex items-center gap-3.5 text-left">
            <span className={'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ' + (m.fait ? 'bg-sun border-sun' : 'border-field bg-white')}>
              {m.fait && <Icon d={I.check} size={15} stroke="#16181D" width={3} />}
            </span>
            <span className="tile w-11 h-11 rounded-[14px]">
              <Icon d={I.star} size={20} stroke={['#5A3FD6', '#A86A00', '#2457D6', '#B02E8F', '#137A52'][missions.indexOf(m) % 5]} />
            </span>
            <span className="flex-1"><b className="block text-sm">{champ(m, 'titre')}</b><span className="text-xs text-muted">{m.fait ? t('missions.fait') : champ(m, 'detail')}</span></span>
            <span className={'font-bold text-sm ' + (m.fait ? 'text-muted line-through' : 'text-ink')}>+{m.points}</span>
          </button>
        ))}
        <div className="bg-sky-soft rounded-[14px] px-3.5 py-3 text-[13px] text-muted leading-snug">{t('missions.info')}</div>
      </div>
    </Screen>
  )
}

// « 22890112201 » ou « 90112201 » → « +228 90112201 »
const numero = tel => { const d = String(tel || '').replace(/\D/g, ''); return d ? '+228 ' + (d.length > 8 && d.startsWith('228') ? d.slice(3) : d) : '' }

export function Profil() {
  const nav = useNavigate()
  const { user, setUser, langue, historique, favoris, boutique, points, seDeconnecter, t, tc } = useApp()
  const connecte = !!user?.verifie
  // Déconnexion : fin de la session, données du compte effacées du téléphone, retour aux slides de découverte
  const deconnexion = async () => { await seDeconnecter(); nav('/', { replace: true }) }
  // Vendre demande un compte : sans compte, l'espace vendeur demande d'abord de le créer
  const vendre = () => {
    if (connecte) setUser({ ...user, role: 'vendeur' })
    nav('/vendeur')
  }
  const dateLocale = langue === 'en' ? 'en-GB' : 'fr-FR'
  return (
    <Screen nav>
      <div className="px-5 pt-5 pb-3.5 flex items-center gap-3.5">
        <div className="w-[60px] h-[60px] rounded-full bg-peach text-ink flex items-center justify-center font-display font-bold text-2xl">
          {user?.prenom ? user.prenom[0].toUpperCase() : <UserIcon />}
        </div>
        <div className="flex-1">
          <div className="font-display text-[22px] font-bold">{user?.prenom || t('profil.invite')}</div>
          <div className="text-[13px] text-muted">{user ? (user.email || numero(user.tel)) + ' · ' + (user.role === 'vendeur' ? t('profil.vendeur') : t('profil.acheteur')) : t('profil.sansCompte')}</div>
        </div>
      </div>
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-6 flex flex-col gap-4">
        {!connecte && <Link to="/inscription" className="btn btn-main h-12">{t('profil.creer')}</Link>}
        {!(connecte && user?.role === 'vendeur') ? (
          <button type="button" onClick={vendre}
            className="relative overflow-hidden bg-pink text-ink rounded-[24px] px-4 py-4 flex items-center gap-3 text-left">
            <span className="tile w-12 h-12 rounded-2xl"><Icon d={I.shop} size={24} stroke="#B02E8F" /></span>
            <span className="flex-1"><b className="block text-[15px]">{t('profil.vends')}</b><span className="text-xs text-ink/70">{t('profil.vendsSous')}</span></span>
            <Icon d={I.chevron} size={20} />
          </button>
        ) : <Link to="/vendeur" className="btn bg-ink text-white h-12">{t('profil.espaceVendeur')}</Link>}
        <Link to="/missions" className="card px-3.5 py-3 flex items-center no-underline text-ink"><b className="flex-1 text-sm">{t('profil.missions', { n: points })}</b><Icon d={I.chevron} size={18} stroke="#5B605C" /></Link>
        <div className="section-title">{t('profil.reglages')}</div>
        <div className="card p-4 flex flex-col gap-2.5">
          <span className="text-sm font-semibold">{t('profil.langue')}</span>
          <ChoixLangue />
        </div>
        <div className="section-title">{t('profil.trajets')}</div>
        <div className="card">
          {historique.length ? historique.slice(0, 4).map(h => (
            <div key={h.id} className="px-4 py-4 flex justify-between items-center border-b border-[#F3EDE0] last:border-0 text-sm">
              <span><b>{new Date(h.date).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'short' })}</b><span className="block text-xs text-muted">{t('profil.trajetInfo', { d: fmtDist(h.longueur), n: h.points.length })}</span></span>
            </div>
          )) : <p className="px-3.5 py-3 text-sm text-muted">{t('profil.aucunTrajet')}</p>}
        </div>
        <div className="section-title">{t('profil.favorites')}</div>
        {favoris.map(id => boutique(id)).filter(Boolean).map(b => (
          <Link key={b.id} to={'/boutique/' + b.id} className="card px-3.5 py-3 flex items-center gap-3 no-underline text-ink">
            <Wax image={b.couverture} className="w-12 h-12 rounded-[14px] shrink-0" /><span className="flex-1"><b className="block text-sm">{b.nom}</b><span className="text-xs text-muted">{tc(b.categorie)}</span></span>
          </Link>
        ))}
        <Link to="/ia" className="card px-4 py-3.5 flex items-center gap-3 no-underline text-ink">
          <span className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-[15px]">✦</span>
          <span className="flex-1"><b className="block text-sm">{t('profil.discuter')}</b><span className="text-xs text-muted">{t('profil.discuterSous')}</span></span>
          <Icon d={I.chevron} size={18} />
        </Link>
        <Link to="/decouverte" state={{ retour: '/profil' }} className="card px-4 py-3.5 flex items-center gap-3 no-underline text-ink">
          <GlassIcon cat="Lieu" size={40} />
          <span className="flex-1"><b className="block text-sm">{t('profil.decouvrir')}</b><span className="text-xs text-muted">{t('profil.decouvrirSous')}</span></span>
          <Icon d={I.chevron} size={18} />
        </Link>
        <div className="card">
          <EtatServeur />
          {user && <button type="button" onClick={deconnexion} className="w-full text-left px-3.5 py-3 text-sm font-semibold text-red-700 border-t border-[#F3EDE0]">{t('profil.deconnecter')}</button>}
        </div>
      </div>
    </Screen>
  )
}
