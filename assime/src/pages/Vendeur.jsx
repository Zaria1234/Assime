// Espace vendeur : tableau de bord, fiche boutique, articles. Il faut un compte pour vendre.
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../store'
import MapView from '../components/MapView'
import { Screen, TopBar, Icon, I, EtatServeur } from '../components/ui'
import { Wax, GlassIcon } from '../components/art'
import { lireImage } from '../lib/image'
import { CATEGORIES } from '../data/demo'
import { fmtMoney } from '../lib/geo'
import { PROPOSITIONS, HEURES, texteHoraires, lireHoraires, horairesLisibles, heureLisible } from '../lib/horaires'
import { CompteRequis } from './Entree'

/** Sans compte vérifié : « Pour vendre, crée d'abord ton compte » à la place de l'espace vendeur */
const avecCompte = Page => function PageVendeur() {
  const { user } = useApp()
  return user?.verifie ? <Page /> : <CompteRequis />
}

export const VendeurAccueil = avecCompte(function VendeurAccueil() {
  const { boutique, maBoutiqueId, coeursDe, t } = useApp()
  const b = boutique(maBoutiqueId)
  const c = b ? coeursDe(b.id) : null
  const lignes = [
    { to: '/vendeur/boutique', label: b ? t('vendeur.modifier') : t('vendeur.creer'), d: I.edit },
    { to: '/vendeur/articles', label: t('vendeur.articles'), d: 'M4 4h16v16H4zM4 14l4-4 5 5 3-3 4 4' },
    ...(b ? [{ to: '/boutique/' + b.id, label: t('vendeur.voirFiche'), d: I.eye }] : []),
  ]
  return (
    <Screen nav>
      <TopBar sub={t('vendeur.espace')} title={b?.nom || t('vendeur.maBoutique')} back={false} />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-6 flex flex-col gap-4">
        {b && <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-[#EEF8F2] text-[#137A52] text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-teal" />{t('vendeur.visible')}</span>}
        {c && (
          <div className="rounded-[24px] bg-white border border-line p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between"><b className="text-[15px]">{t('vendeur.coeurs')}</b><span className="text-[11px] text-muted">{t('vendeur.coeursVisibles')}</span></div>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-[#E6F4EC] text-[#137A52] flex items-center justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10v10H4V10zM7 10l4-7c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7z" /></svg></span>
              <div><div className="h-display text-[26px] leading-none">{c.affiches}</div><div className="text-[12px] text-muted mt-1">{c.affiches ? t('vendeur.pouces') : t('vendeur.aucunCoeur')}</div></div>
            </div>
            {c.moins > 0 && (
              <div className="rounded-[16px] bg-[#FFF4E5] px-3.5 py-3 text-[13px] leading-relaxed">
                <b>{t('vendeur.moins', { n: c.moins })}</b> {t('vendeur.moinsTexte')}
              </div>
            )}
          </div>
        )}
        <div className="card"><EtatServeur /></div>
        <div className="section-title mt-2">{t('vendeur.semaine')}</div>
        <div className="grid grid-cols-3 gap-2.5">
          {[['—', t('vendeur.vues')], ['—', t('vendeur.guides')], ['—', t('vendeur.whatsapp')]].map(([n, l]) => (
            <div key={l} className="card p-3"><div className="font-display text-2xl font-bold">{n}</div><div className="text-xs text-muted">{l}</div></div>
          ))}
        </div>
        <p className="text-xs text-muted -mt-1.5">{t('vendeur.stats')}</p>
        <div className="section-title">{t('vendeur.gerer')}</div>
        <div className="card">
          {lignes.map(l => (
            <Link key={l.to} to={l.to} className="p-3.5 flex items-center gap-3 no-underline text-ink border-b border-[#F3EDE0] last:border-0">
              <Icon d={l.d} stroke="#16181D" /><span className="flex-1 font-semibold text-[15px]">{l.label}</span><Icon d={I.chevron} size={18} stroke="#5B605C" />
            </Link>
          ))}
        </div>
        <Link to="/missions" className="card !shadow-none px-3.5 py-3 flex items-center gap-3 no-underline text-ink">
          <span className="w-10 h-10 rounded-full bg-lilac text-ink flex items-center justify-center"><Icon d={I.star} size={18} /></span>
          <span className="flex-1"><b className="block text-[14px]">{t('vendeur.missions')}</b><span className="text-[12px] text-muted">{t('vendeur.missionsSous')}</span></span>
          <Icon d={I.chevron} size={18} stroke="#5E6B65" />
        </Link>
        <Link to="/carte" className="bg-white border border-line text-ink rounded-2xl px-4 py-3.5 flex items-center gap-3 no-underline">
          <Icon d={I.map} size={24} />
          <span className="flex-1"><b className="block text-[15px]">{t('vendeur.naviguer')}</b><span className="text-xs text-muted">{t('vendeur.naviguerSous')}</span></span>
        </Link>
      </div>
    </Screen>
  )
})

/** Choisir / changer / retirer une photo */
function ChoixPhoto({ valeur, onChange, rond = false, className = '', texte }) {
  const { t } = useApp()
  const [erreur, setErreur] = useState('')
  const choisir = async e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    try { setErreur(''); onChange(await lireImage(f)) } catch { setErreur(t('photo.erreur')) }
  }
  return (
    <div className={'relative ' + className}>
      <label className={'w-full h-full overflow-hidden flex flex-col items-center justify-center gap-1 cursor-pointer text-muted text-[12px] font-semibold ' + (valeur ? '' : 'bg-[#EEF8F2] border-[1.5px] border-dashed border-[#B7DCC8] ') + (rond ? 'rounded-full' : 'rounded-[20px]')}>
        {valeur ? <img src={valeur} alt="" className="w-full h-full object-cover" /> : <><Icon d={I.camera} size={22} stroke="#137A52" /><span className="text-center px-2">{texte || t('photo.ajouter')}</span></>}
        <input type="file" accept="image/*" className="sr-only" onChange={choisir} />
      </label>
      {valeur && (
        <div className="absolute right-1.5 bottom-1.5 flex gap-1">
          <label className="h-7 px-2.5 rounded-full bg-white/95 shadow text-[11px] font-semibold flex items-center cursor-pointer">{t('photo.changer')}<input type="file" accept="image/*" className="sr-only" onChange={choisir} /></label>
          {!rond && <button type="button" onClick={() => onChange(null)} className="h-7 px-2.5 rounded-full bg-white/95 shadow text-[11px] font-semibold text-red-700">{t('photo.retirer')}</button>}
        </div>
      )}
      {erreur && <p className="text-[12px] text-red-700 mt-1">{erreur}</p>}
    </div>
  )
}

/** Astérisque rouge des champs obligatoires */
const Requis = () => {
  const { t } = useApp()
  return <span className="text-red-600 ml-0.5" aria-hidden="true" title={t('form.obligatoire')}>*</span>
}
/** Message rouge sous un champ */
const Erreur = ({ id, children }) => (children ? <p id={id} className="mt-1.5 text-[13px] font-semibold text-red-700" role="alert">{children}</p> : null)
const ROUGE = '!border-red-600 !border-2 bg-red-50/40'

/** Horaires : propositions en un toucher, jours + heures, ou texte libre. valeur = texte enregistré (« Lun–Sam · 7h–18h ») */
function ChoixHoraires({ valeur, onChange }) {
  const { langue, t } = useApp()
  const lu = lireHoraires(valeur)
  const [mode, setMode] = useState(valeur && !lu ? 'libre' : lu && !PROPOSITIONS.some(p => texteHoraires(p) === valeur) ? 'jours' : 'propositions')
  const [jours, setJours] = useState(lu?.jours || [0, 1, 2, 3, 4, 5])
  const [de, setDe] = useState(lu?.de || '7:00')
  const [a, setA] = useState(lu?.a || '18:00')
  const majJours = (j, d = de, f = a) => { setJours(j); setDe(d); setA(f); onChange(j.length ? texteHoraires({ jours: j, de: d, a: f }) : '') }
  const ongle = (id, x) => (
    <button type="button" onClick={() => { setMode(id); if (id === 'jours') majJours(jours) }} aria-pressed={mode === id}
      className={'h-9 px-3 rounded-full text-[13px] font-semibold ' + (mode === id ? 'bg-ink text-white' : 'bg-white border border-line text-ink')}>{x}</button>
  )
  const heure = h => heureLisible(h, langue)
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('form.horaires')}>
        {ongle('propositions', t('hor.propositions'))}{ongle('jours', t('hor.jours'))}{ongle('libre', t('hor.libre'))}
      </div>
      {mode === 'propositions' && (
        <div className="flex flex-col gap-2">
          {PROPOSITIONS.map(p => {
            const texte = texteHoraires(p)
            return (
              <button key={texte} type="button" onClick={() => onChange(texte)} aria-pressed={valeur === texte}
                className={'h-11 px-4 rounded-[14px] text-left text-[14px] font-semibold flex items-center justify-between ' + (valeur === texte ? 'bg-[#E6F4EC] text-brand border-2 border-brand' : 'bg-white border border-line')}>
                {horairesLisibles(texte, langue, t)}{valeur === texte && <Icon d={I.check} size={18} />}
              </button>
            )
          })}
        </div>
      )}
      {mode === 'jours' && (
        <div className="card !shadow-none p-3 flex flex-col gap-3">
          <div className="flex justify-between gap-1" role="group" aria-label={t('hor.lesJours')}>
            {[0, 1, 2, 3, 4, 5, 6].map(i => {
              const actif = jours.includes(i)
              return (
                <button key={i} type="button" onClick={() => majJours(actif ? jours.filter(x => x !== i) : [...jours, i])} aria-pressed={actif} aria-label={t('jourLong.' + i)}
                  className={'w-10 h-10 rounded-full text-[14px] font-bold ' + (actif ? 'bg-brand text-white' : 'bg-white border border-line text-ink')}>{t('jourLettre.' + i)}</button>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="text-[12px] font-semibold text-muted">{t('hor.ouverture')}
              <select value={de} onChange={e => majJours(jours, e.target.value, a)} className="field h-11 mt-1 !px-3">{HEURES.map(h => <option key={h} value={h}>{heure(h)}</option>)}</select>
            </label>
            <label className="text-[12px] font-semibold text-muted">{t('hor.fermeture')}
              <select value={a} onChange={e => majJours(jours, de, e.target.value)} className="field h-11 mt-1 !px-3">{HEURES.map(h => <option key={h} value={h}>{heure(h)}</option>)}</select>
            </label>
          </div>
          {!jours.length && <p className="text-[12px] font-semibold text-red-700">{t('hor.aucunJour')}</p>}
        </div>
      )}
      {mode === 'libre' && (
        <input id="hor" className="field" placeholder={t('form.horairesPh')} value={valeur} onChange={e => onChange(e.target.value)} aria-label={t('hor.libre')} />
      )}
      {valeur && mode !== 'libre' && <p className="text-[13px] text-muted" aria-live="polite">{t('hor.resultat', { x: horairesLisibles(valeur, langue, t) })}</p>}
    </div>
  )
}

/** Fenêtre de confirmation : supprimer ma boutique (taper son nom) */
function SuppressionBoutique({ nom, onFermer }) {
  const nav = useNavigate()
  const { supprimerMaBoutique, t } = useApp()
  const [saisie, setSaisie] = useState('')
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState('')
  const pareil = saisie.trim().toLowerCase() === nom.trim().toLowerCase()
  const supprimer = async e => {
    e.preventDefault()
    if (!pareil || attente) return
    setAttente(true); setErreur('')
    try { await supprimerMaBoutique(); nav('/vendeur', { replace: true }) } catch (err) { console.error('[Assimé] suppression', err); setAttente(false); setErreur(t('suppr.erreur')) }
  }
  return (
    <div className="absolute inset-0 z-[2000] bg-black/50 flex items-end" role="dialog" aria-modal="true" aria-labelledby="suppr-titre" onKeyDown={e => e.key === 'Escape' && onFermer()}>
      <form onSubmit={supprimer} className="w-full bg-white rounded-t-[28px] p-5 pb-7 flex flex-col gap-3">
        <h2 id="suppr-titre" className="h-display text-[21px]">{t('suppr.titre')}</h2>
        <p className="text-[14px] text-ink/80 leading-relaxed">{t('suppr.texte')}</p>
        <label htmlFor="suppr-nom" className="text-[13px] font-semibold">{t('suppr.taper', { nom })}</label>
        <input id="suppr-nom" autoFocus className="field" value={saisie} onChange={e => setSaisie(e.target.value)} autoComplete="off" placeholder={nom} />
        {erreur && <p className="text-[13px] font-semibold text-red-700" role="alert">{erreur}</p>}
        <button type="submit" disabled={!pareil || attente} className="btn h-[50px] bg-red-600 text-white">{attente ? t('suppr.enCours') : t('suppr.confirmer')}</button>
        <button type="button" onClick={onFermer} className="btn h-[46px] bg-white border border-line text-ink">{t('commun.annuler')}</button>
      </form>
    </div>
  )
}

export const VendeurBoutique = avecCompte(function VendeurBoutique() {
  const nav = useNavigate()
  const { boutique, maBoutiqueId, setMaBoutiqueId, setBoutiques, moi, gpsIndispo, t, tc } = useApp()
  const existante = boutique(maBoutiqueId)
  const [nom, setNom] = useState(existante?.nom || '')
  const [categorie, setCategorie] = useState(existante?.categorie || 'Pagnes wax')
  const [autre, setAutre] = useState(existante && !CATEGORIES.includes(existante.categorie) ? existante.categorie : '')
  const [saisieAutre, setSaisieAutre] = useState(!!autre)
  const [pos, setPos] = useState(existante?.pos || null)
  const [repere, setRepere] = useState(existante?.repere || '')
  const [telephone, setTelephone] = useState(existante?.telephone || '')
  const [whatsapp, setWhatsapp] = useState(existante?.whatsapp || '')
  const [horaires, setHoraires] = useState(existante?.horaires && existante.horaires !== '[Horaires]' && existante.horaires !== 'Horaires non indiqués' ? existante.horaires : '')
  const [couverture, setCouverture] = useState(existante?.couverture || null)
  const [photo, setPhoto] = useState(existante?.photo || null)
  const [msgGps, setMsgGps] = useState('')
  const [essaye, setEssaye] = useState(false) // erreurs affichées après le premier essai d'envoi
  const [recadrer, setRecadrer] = useState(0)
  const [suppression, setSuppression] = useState(false)
  const blocs = { nom: useRef(null), cat: useRef(null), pos: useRef(null), contact: useRef(null) }
  const cat = saisieAutre ? autre.trim() : categorie
  // Champs obligatoires : recalculés à chaque saisie, le rouge disparaît dès que le champ est rempli
  const erreurs = {
    nom: !nom.trim() && 'form.errNom',
    cat: !cat && 'form.errCat',
    pos: !pos && 'form.errPos',
    contact: !telephone.replace(/\D/g, '') && !whatsapp.replace(/\D/g, '') && 'form.errContact',
  }
  const voir = k => essaye && erreurs[k]
  const maPosition = () => {
    if (moi) { setPos(moi); setRecadrer(n => n + 1); setMsgGps(gpsIndispo ? 'form.gpsSimule' : 'form.gpsOk') }
    else setMsgGps('form.gpsIntrouvable')
  }
  const publier = e => {
    e.preventDefault()
    const premiere = ['nom', 'cat', 'pos', 'contact'].find(k => erreurs[k])
    if (premiere) {
      setEssaye(true)
      // On amène la page sur la première erreur
      const el = blocs[premiere].current
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.querySelector('input')?.focus({ preventScroll: true })
      return
    }
    const id = existante?.id || 'b' + Date.now()
    const fiche = { articles: [], verifiee: false, ...(existante || {}), id, nom: nom.trim(), categorie: cat, zone: existante?.zone || 'Zone ' + cat.toLowerCase(),
      pos, repere, telephone, whatsapp, horaires: horaires || 'Horaires non indiqués', couverture, photo }
    try {
      setBoutiques(bs => (existante ? bs.map(b => (b.id === id ? fiche : b)) : [...bs, fiche]))
      setMaBoutiqueId(id)
      nav('/vendeur')
    } catch { alert(t('form.lourd')) }
  }
  const nbErreurs = Object.values(erreurs).filter(Boolean).length
  return (
    <Screen>
      <form onSubmit={publier} noValidate className="flex-1 min-h-0 flex flex-col">
        <TopBar title={existante ? t('vendeur.modifier') : t('vendeur.creer')} back="/vendeur" />
        <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-4 flex flex-col gap-4">
          <div className="relative">
            <ChoixPhoto valeur={couverture} onChange={setCouverture} className="h-40" texte={t('photo.couverture')} />
            <div className="absolute -bottom-7 left-4 w-[76px] h-[76px] rounded-full border-4 border-white shadow bg-white">
              <ChoixPhoto valeur={photo} onChange={setPhoto} rond className="w-full h-full" texte={t('photo.logo')} />
            </div>
          </div>
          <div className="mt-6" ref={blocs.nom}>
            <label htmlFor="nom" className="label">{t('form.nom')}<Requis /></label>
            <input id="nom" className={'field mt-1.5 ' + (voir('nom') ? ROUGE : '')} placeholder={t('form.nomPh')} value={nom} onChange={e => setNom(e.target.value)}
              required aria-required="true" aria-invalid={!!voir('nom')} aria-describedby={voir('nom') ? 'err-nom' : undefined} />
            <Erreur id="err-nom">{voir('nom') && t(erreurs.nom)}</Erreur>
          </div>
          <div ref={blocs.cat}>
            <div className="label mb-2" id="lbl-cat">{t('form.vends')}<Requis /></div>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="lbl-cat">
              {CATEGORIES.filter(c => c !== 'Autre').map(c => (
                <button key={c} type="button" onClick={() => { setCategorie(c); setSaisieAutre(false) }} aria-pressed={!saisieAutre && categorie === c}
                  className={'h-10 pl-1.5 pr-3.5 rounded-full text-sm flex items-center gap-1.5 ' + (!saisieAutre && categorie === c ? 'bg-ink text-white font-semibold' : 'bg-white border border-line')}>
                  <GlassIcon cat={c} size={28} actif={!saisieAutre && categorie === c} />{tc(c)}</button>
              ))}
              <button type="button" onClick={() => setSaisieAutre(true)} aria-pressed={saisieAutre}
                className={'h-10 px-3.5 rounded-full text-sm ' + (saisieAutre ? 'bg-ink text-white font-semibold' : 'bg-white border border-dashed border-field')}>{t('form.autre')}</button>
            </div>
            {saisieAutre && <input autoFocus className={'field mt-2 ' + (voir('cat') ? ROUGE : '')} placeholder={t('form.autrePh')} value={autre} onChange={e => setAutre(e.target.value)}
              aria-label={t('form.autreAria')} aria-invalid={!!voir('cat')} aria-describedby={voir('cat') ? 'err-cat' : undefined} />}
            <Erreur id="err-cat">{voir('cat') && t(erreurs.cat)}</Erreur>
          </div>
          <div ref={blocs.pos}>
            <div className="label mb-2">{t('form.ou')}<Requis /></div>
            <div className={'card p-3 flex flex-col gap-2.5 ' + (voir('pos') ? ROUGE : '')}>
              <button type="button" onClick={maPosition} className="btn bg-ink text-white h-12"><Icon d="M12 2v3M12 19v3M2 12h3M19 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" size={18} />{t('form.gps')}</button>
              <MapView className="h-44 rounded-xl overflow-hidden" showToggle={false} boutiques={pos ? [{ id: 'x', nom: nom || t('vendeur.maBoutique'), categorie: cat || 'Tout', pos }] : []} selection="x" onClick={setPos}
                fit={pos ? [pos] : moi ? [moi] : undefined} recadrer={recadrer} />
              <p className="text-xs text-muted">{msgGps ? t(msgGps) : pos ? t('form.posOk') : t('form.posAide')}</p>
            </div>
            <Erreur id="err-pos">{voir('pos') && t(erreurs.pos)}</Erreur>
          </div>
          <div>
            <label htmlFor="repere" className="label">{t('form.repere')}</label>
            <input id="repere" className="field mt-1.5" placeholder={t('form.reperePh')} value={repere} onChange={e => setRepere(e.target.value)} />
          </div>
          <div ref={blocs.contact}>
            <div className="label mb-1.5">{t('form.contact')}<Requis /></div>
            <div className="grid grid-cols-2 gap-2.5">
              <div><label htmlFor="tel" className="text-[13px] text-muted font-semibold">{t('form.tel')}</label><input id="tel" type="tel" className={'field mt-1 ' + (voir('contact') ? ROUGE : '')} placeholder="90 00 00 00" value={telephone} onChange={e => setTelephone(e.target.value)} aria-invalid={!!voir('contact')} aria-describedby={voir('contact') ? 'err-contact' : undefined} /></div>
              <div><label htmlFor="wa" className="text-[13px] text-muted font-semibold">{t('form.wa')}</label><input id="wa" type="tel" className={'field mt-1 ' + (voir('contact') ? ROUGE : '')} placeholder="90 00 00 00" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} aria-invalid={!!voir('contact')} aria-describedby={voir('contact') ? 'err-contact' : undefined} /></div>
            </div>
            <Erreur id="err-contact">{voir('contact') && t(erreurs.contact)}</Erreur>
          </div>
          <div>
            <div className="label mb-2">{t('form.horaires')}</div>
            <ChoixHoraires valeur={horaires} onChange={setHoraires} />
          </div>
          {existante && (
            <div className="mt-4 pt-4 border-t border-line">
              <button type="button" onClick={() => setSuppression(true)} className="btn w-full h-12 bg-white border-2 border-red-600 text-red-700">{t('suppr.bouton')}</button>
            </div>
          )}
        </div>
        <div className="px-5 py-3 bg-white border-t border-line">
          <button type="submit" className="btn btn-main no-arrow w-full h-[52px]">{existante ? t('form.enregistrer') : t('form.publier')}</button>
          {essaye && nbErreurs > 0 && <p className="text-[12px] text-red-700 font-semibold text-center mt-1.5">{t('form.manque')}</p>}
        </div>
      </form>
      {suppression && existante && <SuppressionBoutique nom={existante.nom} onFermer={() => setSuppression(false)} />}
    </Screen>
  )
})

export const Articles = avecCompte(function Articles() {
  const { boutique, maBoutiqueId, setBoutiques, t } = useApp()
  const b = boutique(maBoutiqueId)
  const vide = { nom: '', prix: '', image: null }
  const [form, setForm] = useState(vide)
  const [edition, setEdition] = useState(null) // id de l'article modifié, ou 'nouveau'
  if (!b) return <Screen nav><TopBar title={t('articles.titre')} back="/vendeur" /><div className="px-5"><Link to="/vendeur/boutique" className="btn btn-main no-arrow h-12">{t('articles.creerDabord')}</Link></div></Screen>
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
        <ChoixPhoto valeur={form.image} onChange={image => setForm(f => ({ ...f, image }))} className="w-[96px] h-[96px] shrink-0" texte={t('photo.photo')} />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <input autoFocus className="field h-11" placeholder={t('articles.nomPh')} aria-label={t('articles.nomPh')} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
          <input inputMode="numeric" className="field h-11" placeholder={t('articles.prixPh')} aria-label={t('articles.prixPh')} value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setEdition(null)} className="btn bg-white border border-line flex-1 h-11 text-sm">{t('commun.annuler')}</button>
        <button type="submit" disabled={!form.nom.trim()} className="btn bg-ink text-white flex-1 h-11 text-sm">{edition === 'nouveau' ? t('commun.ajouter') : t('commun.enregistrer')}</button>
      </div>
    </form>
  )
  return (
    <Screen nav>
      <TopBar title={t('articles.titre')} sub={b.nom} back="/vendeur"
        right={edition !== 'nouveau' && <button type="button" onClick={() => ouvrir(null)} className="h-10 px-3.5 rounded-full bg-ink text-white text-[13px] font-semibold">{t('articles.ajouter')}</button>} />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-4 flex flex-col gap-2.5">
        {edition === 'nouveau' && Formulaire}
        {!articles.length && edition !== 'nouveau' && (
          <button type="button" onClick={() => ouvrir(null)} className="rounded-[20px] border-[1.5px] border-dashed border-[#B7DCC8] bg-[#EEF8F2] p-6 text-[14px] font-semibold text-[#137A52]">{t('articles.premier')}</button>
        )}
        {articles.map(a => edition === a.id ? <div key={a.id}>{Formulaire}</div> : (
          <div key={a.id} className="card p-2.5 flex items-center gap-3">
            <Wax image={a.image} className="w-16 h-16 rounded-[14px] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{a.nom}</div>
              <div className="text-[13px] text-muted">{a.prix ? fmtMoney(a.prix) + ' FCFA' : t('articles.prixNon')}</div>
              <button type="button" role="switch" aria-checked={a.stock} onClick={() => setArticles(arr => arr.map(x => (x.id === a.id ? { ...x, stock: !x.stock } : x)))}
                className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold">
                <span className={'w-9 h-[22px] rounded-full relative ' + (a.stock ? 'bg-[#137A52]' : 'bg-field')}><span className={'absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ' + (a.stock ? 'right-[3px]' : 'left-[3px]')} /></span>
                {a.stock ? t('articles.enStock') : t('articles.rupture')}
              </button>
            </div>
            <button type="button" onClick={() => ouvrir(a)} aria-label={t('commun.modifierNom', { nom: a.nom })} className="w-9 h-9 rounded-full border border-line flex items-center justify-center"><Icon d={I.edit} size={16} /></button>
            <button type="button" onClick={() => setArticles(arr => arr.filter(x => x.id !== a.id))} aria-label={t('commun.supprimerNom', { nom: a.nom })} className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-muted text-lg">×</button>
          </div>
        ))}
        <p className="text-xs text-muted px-0.5">{t('articles.info')}</p>
      </div>
    </Screen>
  )
})
