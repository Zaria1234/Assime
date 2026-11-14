// Espace vendeur : tableau de bord, fiche boutique, articles
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import MapView from '../components/MapView'
import { Screen, TopBar, Icon, I, EtatServeur } from '../components/ui'
import { Wax, GlassIcon } from '../components/art'
import { lireImage } from '../lib/image'
import { CATEGORIES } from '../data/demo'
import { fmtMoney } from '../lib/geo'

export function VendeurAccueil() {
  const { boutique, maBoutiqueId, coeursDe } = useApp()
  const b = boutique(maBoutiqueId)
  const c = b ? coeursDe(b.id) : null
  const lignes = [
    { to: '/vendeur/boutique', label: b ? 'Modifier ma boutique' : 'Créer ma boutique', d: I.edit },
    { to: '/vendeur/articles', label: 'Mes articles et prix', d: 'M4 4h16v16H4zM4 14l4-4 5 5 3-3 4 4' },
    ...(b ? [{ to: '/boutique/' + b.id, label: 'Voir ma fiche comme un client', d: I.eye }] : []),
  ]
  return (
    <Screen nav>
      <TopBar sub="Espace vendeur" title={b?.nom || 'Ma boutique'} back={false} />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-6 flex flex-col gap-4">
        {b && <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-[#EEF8F2] text-[#137A52] text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-teal" />Visible sur la carte</span>}
        {c && (
          <div className="rounded-[24px] bg-white border border-line p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between"><b className="text-[15px]">Mes coups de cœur</b><span className="text-[11px] text-muted">visibles sur la carte</span></div>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-[#E6F4EC] text-[#137A52] flex items-center justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10v10H4V10zM7 10l4-7c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7z" /></svg></span>
              <div><div className="h-display text-[26px] leading-none">{c.affiches}</div><div className="text-[12px] text-muted mt-1">{c.affiches ? 'pouces levés affichés' : "Ta boutique n'a pas encore de coup de cœur"}</div></div>
            </div>
            {c.moins > 0 && (
              <div className="rounded-[16px] bg-[#FFF4E5] px-3.5 py-3 text-[13px] leading-relaxed">
                <b>{c.moins} client{c.moins > 1 ? 's' : ''} n'{c.moins > 1 ? 'ont' : 'a'} pas aimé.</b> Toi seul·e le vois : ce n'est pas affiché sur la carte. Chaque pouce baissé retire un pouce levé.
              </div>
            )}
          </div>
        )}
        <div className="card"><EtatServeur /></div>
        <div className="section-title mt-2">Cette semaine</div>
        <div className="grid grid-cols-3 gap-2.5">
          {[['—', 'vues de ta fiche'], ['—', 'clients guidés'], ['—', 'messages WhatsApp']].map(([n, l]) => (
            <div key={l} className="card p-3"><div className="font-display text-2xl font-bold">{n}</div><div className="text-xs text-muted">{l}</div></div>
          ))}
        </div>
        <p className="text-xs text-muted -mt-1.5">Les statistiques arriveront avec le back-end.</p>
        <div className="section-title">Gérer</div>
        <div className="card">
          {lignes.map(l => (
            <Link key={l.to} to={l.to} className="p-3.5 flex items-center gap-3 no-underline text-ink border-b border-[#F3EDE0] last:border-0">
              <Icon d={l.d} stroke="#16181D" /><span className="flex-1 font-semibold text-[15px]">{l.label}</span><Icon d={I.chevron} size={18} stroke="#5B605C" />
            </Link>
          ))}
        </div>
        <Link to="/missions" className="card !shadow-none px-3.5 py-3 flex items-center gap-3 no-underline text-ink">
          <span className="w-10 h-10 rounded-full bg-lilac text-ink flex items-center justify-center"><Icon d={I.star} size={18} /></span>
          <span className="flex-1"><b className="block text-[14px]">Mes missions vendeur</b><span className="text-[12px] text-muted">Photos, numéro, prix : gagne des points et de la visibilité</span></span>
          <Icon d={I.chevron} size={18} stroke="#5E6B65" />
        </Link>
        <Link to="/carte" className="bg-white border border-line text-ink rounded-2xl px-4 py-3.5 flex items-center gap-3 no-underline">
          <Icon d={I.map} size={24} />
          <span className="flex-1"><b className="block text-[15px]">Naviguer dans le marché</b><span className="text-xs text-muted">Va chez un fournisseur, retrouve ta moto</span></span>
        </Link>
      </div>
    </Screen>
  )
}

/** Choisir / changer / retirer une photo */
function ChoixPhoto({ valeur, onChange, rond = false, className = '', texte = 'Ajouter une photo' }) {
  const [erreur, setErreur] = useState('')
  const choisir = async e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    try { setErreur(''); onChange(await lireImage(f)) } catch { setErreur("Cette image n'a pas pu être lue.") }
  }
  return (
    <div className={'relative ' + className}>
      <label className={'w-full h-full overflow-hidden flex flex-col items-center justify-center gap-1 cursor-pointer text-muted text-[12px] font-semibold ' + (valeur ? '' : 'bg-[#EEF8F2] border-[1.5px] border-dashed border-[#B7DCC8] ') + (rond ? 'rounded-full' : 'rounded-[20px]')}>
        {valeur ? <img src={valeur} alt="" className="w-full h-full object-cover" /> : <><Icon d={I.camera} size={22} stroke="#137A52" /><span className="text-center px-2">{texte}</span></>}
        <input type="file" accept="image/*" className="sr-only" onChange={choisir} />
      </label>
      {valeur && (
        <div className="absolute right-1.5 bottom-1.5 flex gap-1">
          <label className="h-7 px-2.5 rounded-full bg-white/95 shadow text-[11px] font-semibold flex items-center cursor-pointer">Changer<input type="file" accept="image/*" className="sr-only" onChange={choisir} /></label>
          {!rond && <button type="button" onClick={() => onChange(null)} className="h-7 px-2.5 rounded-full bg-white/95 shadow text-[11px] font-semibold text-red-700">Retirer</button>}
        </div>
      )}
      {erreur && <p className="text-[12px] text-red-700 mt-1">{erreur}</p>}
    </div>
  )
}

export function VendeurBoutique() {
  const nav = useNavigate()
  const { boutique, maBoutiqueId, setMaBoutiqueId, setBoutiques, moi, gpsIndispo } = useApp()
  const existante = boutique(maBoutiqueId)
  const [nom, setNom] = useState(existante?.nom || '')
  const [categorie, setCategorie] = useState(existante?.categorie || 'Pagnes wax')
  const [autre, setAutre] = useState(existante && !CATEGORIES.includes(existante.categorie) ? existante.categorie : '')
  const [saisieAutre, setSaisieAutre] = useState(!!autre)
  const [pos, setPos] = useState(existante?.pos || null)
  const [repere, setRepere] = useState(existante?.repere || '')
  const [telephone, setTelephone] = useState(existante?.telephone || '')
  const [whatsapp, setWhatsapp] = useState(existante?.whatsapp || '')
  const [horaires, setHoraires] = useState(existante?.horaires && existante.horaires !== '[Horaires]' ? existante.horaires : '')
  const [couverture, setCouverture] = useState(existante?.couverture || null)
  const [photo, setPhoto] = useState(existante?.photo || null)
  const [msgGps, setMsgGps] = useState('')
  const cat = saisieAutre ? autre.trim() : categorie
  const valide = nom.trim() && pos && cat
  const maPosition = () => {
    if (moi) { setPos(moi); setMsgGps(gpsIndispo ? 'GPS indisponible ici : position simulée. Touche la carte pour corriger.' : 'Position GPS enregistrée.') }
    else setMsgGps('Position introuvable. Touche la carte à l\'endroit de ton stand.')
  }
  const publier = e => {
    e.preventDefault()
    if (!valide) return
    const id = existante?.id || 'b' + Date.now()
    const fiche = { articles: [], verifiee: false, ...(existante || {}), id, nom: nom.trim(), categorie: cat, zone: existante?.zone || 'Zone ' + cat.toLowerCase(),
      pos, repere, telephone, whatsapp, horaires: horaires || 'Horaires non indiqués', couverture, photo }
    try {
      setBoutiques(bs => (existante ? bs.map(b => (b.id === id ? fiche : b)) : [...bs, fiche]))
      setMaBoutiqueId(id)
      nav('/vendeur')
    } catch { alert('Photos trop lourdes pour le téléphone. Essaie une autre image.') }
  }
  return (
    <Screen>
      <form onSubmit={publier} className="flex-1 min-h-0 flex flex-col">
        <TopBar title={existante ? 'Modifier ma boutique' : 'Créer ma boutique'} back="/vendeur" />
        <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-4 flex flex-col gap-4">
          <div className="relative">
            <ChoixPhoto valeur={couverture} onChange={setCouverture} className="h-40" texte="Photo de couverture (ton stand, ta vitrine)" />
            <div className="absolute -bottom-7 left-4 w-[76px] h-[76px] rounded-full border-4 border-white shadow bg-white">
              <ChoixPhoto valeur={photo} onChange={setPhoto} rond className="w-full h-full" texte="Logo" />
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor="nom" className="label">Nom de la boutique</label>
            <input id="nom" className="field mt-1.5" placeholder="Ex. : Chez Aurore Pagnes" value={nom} onChange={e => setNom(e.target.value)} />
          </div>
          <div>
            <div className="label mb-2">Ce que je vends</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c !== 'Autre').map(c => (
                <button key={c} type="button" onClick={() => { setCategorie(c); setSaisieAutre(false) }} aria-pressed={!saisieAutre && categorie === c}
                  className={'h-10 pl-1.5 pr-3.5 rounded-full text-sm flex items-center gap-1.5 ' + (!saisieAutre && categorie === c ? 'bg-ink text-white font-semibold' : 'bg-white border border-line')}>
                  <GlassIcon cat={c} size={28} actif={!saisieAutre && categorie === c} />{c}</button>
              ))}
              <button type="button" onClick={() => setSaisieAutre(true)} aria-pressed={saisieAutre}
                className={'h-10 px-3.5 rounded-full text-sm ' + (saisieAutre ? 'bg-ink text-white font-semibold' : 'bg-white border border-dashed border-field')}>+ Autre chose</button>
            </div>
            {saisieAutre && <input autoFocus className="field mt-2" placeholder="Écris ce que tu vends (ex. : Mèches, Téléphones…)" value={autre} onChange={e => setAutre(e.target.value)} aria-label="Autre catégorie" />}
          </div>
          <div>
            <div className="label mb-2">Où est ma boutique ?</div>
            <div className="card p-3 flex flex-col gap-2.5">
              <button type="button" onClick={maPosition} className="btn bg-ink text-white h-12"><Icon d="M12 2v3M12 19v3M2 12h3M19 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" size={18} />Utiliser ma position GPS</button>
              <MapView className="h-44 rounded-xl overflow-hidden" showToggle={false} boutiques={pos ? [{ id: 'x', nom: nom || 'Ma boutique', pos }] : []} onClick={setPos} fit={pos ? [pos] : undefined} />
              <p className="text-xs text-muted">{msgGps || (pos ? 'Position enregistrée. Touche la carte pour la corriger.' : 'Mets-toi devant ton stand et touche le bouton, ou touche la carte.')}</p>
            </div>
          </div>
          <div>
            <label htmlFor="repere" className="label">Repère pour me trouver</label>
            <input id="repere" className="field mt-1.5" placeholder="Ex. : en face de la zone des sacs" value={repere} onChange={e => setRepere(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div><label htmlFor="tel" className="label">Téléphone</label><input id="tel" type="tel" className="field mt-1.5" placeholder="90 00 00 00" value={telephone} onChange={e => setTelephone(e.target.value)} /></div>
            <div><label htmlFor="wa" className="label">WhatsApp</label><input id="wa" type="tel" className="field mt-1.5" placeholder="90 00 00 00" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /></div>
          </div>
          <div>
            <label htmlFor="hor" className="label">Horaires</label>
            <input id="hor" className="field mt-1.5" placeholder="Ex. : Lun–Sam · 7h–18h" value={horaires} onChange={e => setHoraires(e.target.value)} />
          </div>
        </div>
        <div className="px-5 py-3 bg-white border-t border-line">
          <button type="submit" disabled={!valide} className="btn btn-main no-arrow w-full h-[52px]">{existante ? 'Enregistrer les modifications' : 'Publier ma boutique'}</button>
          {!valide && <p className="text-[11px] text-muted text-center mt-1.5">Il faut un nom, ce que tu vends et ta position.</p>}
        </div>
      </form>
    </Screen>
  )
}

export function Articles() {
  const { boutique, maBoutiqueId, setBoutiques } = useApp()
  const b = boutique(maBoutiqueId)
  const vide = { nom: '', prix: '', image: null }
  const [form, setForm] = useState(vide)
  const [edition, setEdition] = useState(null) // id de l'article modifié, ou 'nouveau'
  if (!b) return <Screen nav><TopBar title="Mes articles" back="/vendeur" /><div className="px-5"><Link to="/vendeur/boutique" className="btn btn-main no-arrow h-12">Créer ma boutique d'abord</Link></div></Screen>
  const articles = (b.articles || []).map((a, i) => ({ ...a, id: a.id || 'a' + i }))
  const setArticles = fn => setBoutiques(bs => bs.map(x => (x.id === b.id ? { ...x, articles: fn((x.articles || []).map((a, i) => ({ ...a, id: a.id || 'a' + i }))) } : x)))
  const ouvrir = a => { setEdition(a ? a.id : 'nouveau'); setForm(a ? { nom: a.nom, prix: a.prix ? String(a.prix) : '', image: a.image || null } : vide) }
  const enregistrer = e => {
    e.preventDefault()
    if (!form.nom.trim()) return
    const champs = { nom: form.nom.trim(), prix: form.prix ? Number(String(form.prix).replace(/\D/g, '')) || null : null, image: form.image }
    if (edition === 'nouveau') setArticles(a => [...a, { id: 'a' + Date.now(), stock: true, ...champs }])
    else setArticles(a => a.map(x => (x.id === edition ? { ...x, ...champs } : x)))
    setEdition(null); setForm(vide)
  }
  const Formulaire = (
    <form onSubmit={enregistrer} className="card p-3 flex flex-col gap-2.5">
      <div className="flex gap-3">
        <ChoixPhoto valeur={form.image} onChange={image => setForm(f => ({ ...f, image }))} className="w-[96px] h-[96px] shrink-0" texte="Photo" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <input autoFocus className="field h-11" placeholder="Nom de l'article" aria-label="Nom de l'article" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
          <input inputMode="numeric" className="field h-11" placeholder="Prix en FCFA" aria-label="Prix en FCFA" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setEdition(null)} className="btn bg-white border border-line flex-1 h-11 text-sm">Annuler</button>
        <button type="submit" disabled={!form.nom.trim()} className="btn bg-ink text-white flex-1 h-11 text-sm">{edition === 'nouveau' ? 'Ajouter' : 'Enregistrer'}</button>
      </div>
    </form>
  )
  return (
    <Screen nav>
      <TopBar title="Mes articles" sub={b.nom} back="/vendeur"
        right={edition !== 'nouveau' && <button type="button" onClick={() => ouvrir(null)} className="h-10 px-3.5 rounded-full bg-ink text-white text-[13px] font-semibold">+ Article</button>} />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-4 flex flex-col gap-2.5">
        {edition === 'nouveau' && Formulaire}
        {!articles.length && edition !== 'nouveau' && (
          <button type="button" onClick={() => ouvrir(null)} className="rounded-[20px] border-[1.5px] border-dashed border-[#B7DCC8] bg-[#EEF8F2] p-6 text-[14px] font-semibold text-[#137A52]">+ Ajouter mon premier article</button>
        )}
        {articles.map(a => edition === a.id ? <div key={a.id}>{Formulaire}</div> : (
          <div key={a.id} className="card p-2.5 flex items-center gap-3">
            <Wax image={a.image} className="w-16 h-16 rounded-[14px] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{a.nom}</div>
              <div className="text-[13px] text-muted">{a.prix ? fmtMoney(a.prix) + ' FCFA' : 'Prix non indiqué'}</div>
              <button type="button" role="switch" aria-checked={a.stock} onClick={() => setArticles(arr => arr.map(x => (x.id === a.id ? { ...x, stock: !x.stock } : x)))}
                className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold">
                <span className={'w-9 h-[22px] rounded-full relative ' + (a.stock ? 'bg-[#137A52]' : 'bg-field')}><span className={'absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ' + (a.stock ? 'right-[3px]' : 'left-[3px]')} /></span>
                {a.stock ? 'En stock' : 'Rupture'}
              </button>
            </div>
            <button type="button" onClick={() => ouvrir(a)} aria-label={'Modifier ' + a.nom} className="w-9 h-9 rounded-full border border-line flex items-center justify-center"><Icon d={I.edit} size={16} /></button>
            <button type="button" onClick={() => setArticles(arr => arr.filter(x => x.id !== a.id))} aria-label={'Supprimer ' + a.nom} className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-muted text-lg">×</button>
          </div>
        ))}
        <p className="text-xs text-muted px-0.5">Quand un client cherche un article que tu as en stock, l'IA lui propose ta boutique.</p>
      </div>
    </Screen>
  )
}
