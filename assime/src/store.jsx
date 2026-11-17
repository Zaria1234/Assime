// État global de l'app : utilisateur, boutiques, liste, trajet en cours.
// Tout est gardé dans le téléphone (localStorage) ; avec Supabase, le profil, les listes et les favoris suivent le compte.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { BOUTIQUES_DEMO, COEURS_DEMO, LISTE_DEMO, TRAJET_DEMO, MISSIONS, MISSIONS_VENDEUR, LIEUX_UTILES } from './data/demo'
import { MARCHE, keepPoint, offset, pathLength } from './lib/geo'
import { parler } from './lib/voix'
import { traduire, traduireCategorie, LANGUES } from './i18n'
import { supabase, identite, sessionActuelle, deconnecter, chargerCompte, enregistrerListes, chargerBoutiques, enregistrerBoutique, supprimerBoutique, chargerCoeurs, envoyerVote, enregistrerProfil, envoyerReleve, abonner, versLigne } from './lib/supabase'

// Un compte neuf commence vide : une liste sans articles, des missions à faire
const nouvelId = () => 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const LISTE_VIDE = () => [{ id: nouvelId(), nom: 'Ma liste', budget: 0, items: [] }]
const aFaire = ms => ms.map(m => ({ ...m, fait: false, detail: m.detail === 'Fait' ? 'Enregistre un trajet de bout en bout' : m.detail }))

// Erreur technique : détail dans la console seulement, message simple à l'écran (clé de traduction)
const ECHEC = 'erreur.echec'
const signaler = e => { console.error('[Assimé]', e); return ECHEC }

// Restes de l'ancienne version (exemples mis d'office) : ils ne doivent pas apparaître hors Mode démo
const NOMS_DEMO = LISTE_DEMO.map(i => i.nom).join('|')
const estListeExemple = l => l.id !== 'demo' && ((l.id === 'l1' && l.nom === 'Marché de samedi') || (l.items || []).map(i => i.nom).join('|') === NOMS_DEMO)

// Position de démonstration quand le GPS ne répond pas
const POSITION_SIMULEE = offset(MARCHE, -10, 5)

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

function usePersist(key, initial) {
  const [v, setV] = useState(() => {
    const defaut = () => (typeof initial === 'function' ? initial() : initial)
    try { const s = localStorage.getItem('assime_' + key); return s ? JSON.parse(s) : defaut() } catch { return defaut() }
  })
  useEffect(() => { try { localStorage.setItem('assime_' + key, JSON.stringify(v)) } catch { /* stockage indisponible */ } }, [key, v])
  return [v, setV]
}

export function AppProvider({ children }) {
  const [user, setUser] = usePersist('user', null) // { prenom, tel, role: 'acheteur' | 'vendeur' }
  // Langue de toute l'interface et de l'IA. Nouvelle clé : l'ancienne valait « ewe » pour tout le monde par défaut.
  const [langueBrute, setLangue] = usePersist('langue_v2', 'fr')
  const langue = LANGUES.some(l => l.id === langueBrute) ? langueBrute : 'fr'
  const t = useCallback((cle, vars) => traduire(langue, cle, vars), [langue])
  const tc = useCallback(cat => traduireCategorie(langue, cat), [langue])
  // Repère du marché dans la langue choisie (nom et indication) ; les noms propres restent tels quels
  // Zone d'une boutique (« Zone des pagnes », écrite par l'app en français) : dans les autres langues, la catégorie traduite
  const zoneDe = useCallback(b => (langue === 'fr' || !b.categorie ? b.zone : traduireCategorie(langue, b.categorie)), [langue])
  const lieuTraduit = useCallback(l => ({ ...l, nom: traduire(langue, 'lieu.' + l.id + '.nom', null, l.nom), note: traduire(langue, 'lieu.' + l.id + '.note', null, l.note) }), [langue])
  useEffect(() => { document.documentElement.lang = langue === 'ewe' ? 'ee' : langue }, [langue])
  // Apparence : 'clair', 'sombre' ou 'auto' (suit le réglage du téléphone). Même règle dans index.html, avant l'affichage.
  const [apparence, setApparence] = usePersist('apparence', 'auto')
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const appliquer = () => {
      const sombre = apparence === 'sombre' || (apparence === 'auto' && !!mq?.matches)
      document.documentElement.classList.toggle('sombre', sombre)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sombre ? '#111315' : '#176B52')
    }
    appliquer()
    if (apparence !== 'auto' || !mq) return
    mq.addEventListener('change', appliquer)
    return () => mq.removeEventListener('change', appliquer)
  }, [apparence])
  const [boutiques, setBoutiques] = usePersist('boutiques_v2', BOUTIQUES_DEMO)
  // Coups de cœur : { boutiqueId: { plus, moins } } et mon vote par boutique ('plus' | 'moins')
  const [coeurs, setCoeurs] = usePersist('coeurs', COEURS_DEMO)
  const [mesVotes, setMesVotes] = usePersist('mes_votes', {})

  // ---- Back-end (Supabase) : 'local' sans clés, sinon 'connexion' → 'synchro' (ou 'erreur' : on reste sur le téléphone) ----
  const [serveur, setServeur] = useState({ etat: supabase ? 'connexion' : 'local', uid: null, anonyme: true, erreur: null, envoi: false })
  const [compteLocal, setCompteLocal] = usePersist('compte', null) // uid du compte dont les données sont sur ce téléphone
  const [compteCharge, setCompteCharge] = useState(null) // uid dont les données serveur sont chargées (avant : on n'envoie rien)
  const [coeursServeur, setCoeursServeur] = useState(null) // { publics: {id: n}, vendeur: {id: {plus, moins}} }
  const dernierEnvoi = useRef({})
  const rafraichirCoeurs = useCallback(async () => {
    if (!supabase) return
    try { const c = await chargerCoeurs(); setCoeursServeur(c); setMesVotes(c.votes) } catch { /* on garde l'affichage actuel */ }
  }, [setMesVotes])

  const coeursDe = id => {
    if (coeursServeur) {
      const v = coeursServeur.vendeur[id]
      return { affiches: coeursServeur.publics[id] ?? 0, plus: v?.plus ?? null, moins: v?.moins ?? 0 }
    }
    const c = coeurs[id] || { plus: 0, moins: 0 }
    return { ...c, affiches: Math.max(0, c.plus - c.moins) } // un pouce baissé retire un pouce levé
  }
  const voter = (id, sens) => {
    const avant = mesVotes[id]
    const nouveau = sens === avant ? undefined : sens
    setMesVotes(v => ({ ...v, [id]: nouveau }))
    if (coeursServeur && !serveur.uid) {
      // Sans compte : identité anonyme créée au premier vote, puis vote envoyé
      identite().then(uid => { setServeur(sv => ({ ...sv, uid, anonyme: true })); return envoyerVote(id, nouveau, uid) }).then(rafraichirCoeurs).catch(rafraichirCoeurs)
      return
    }
    if (coeursServeur && serveur.uid) {
      // Affichage immédiat, puis confirmation par le serveur
      const val = x => (x === 'plus' ? 1 : x === 'moins' ? -1 : 0)
      setCoeursServeur(c => ({ ...c, publics: { ...c.publics, [id]: Math.max(0, (c.publics[id] ?? 0) + val(nouveau) - val(avant)) } }))
      envoyerVote(id, nouveau, serveur.uid).then(rafraichirCoeurs).catch(rafraichirCoeurs)
      return
    }
    setCoeurs(cs => {
      const c = { ...(cs[id] || { plus: 0, moins: 0 }) }
      if (avant) c[avant] = Math.max(0, c[avant] - 1)
      if (nouveau) c[nouveau] += 1
      return { ...cs, [id]: c }
    })
  }
  // Ce qui intéresse l'utilisateur (recherches, boutiques visitées) et ses activités : l'IA s'en sert pour ajouter des sections
  const [interets, setInterets] = usePersist('interets', {})
  const [activites, setActivites] = usePersist('activites', [])
  const noterInteret = cat => { if (cat) setInterets(i => ({ ...i, [cat]: (i[cat] || 0) + 1 })) }
  const [maBoutiqueId, setMaBoutiqueId] = usePersist('ma_boutique', null)
  // Plusieurs listes de marché, chacune avec son budget
  const [listes, setListes] = usePersist('listes', LISTE_VIDE)
  const [listeId, setListeId] = usePersist('liste_active', null)
  const active = listes.find(l => l.id === listeId) || listes[0] || null
  const majActive = patch => setListes(ls => ls.map(l => (active && l.id === active.id ? { ...l, ...patch(l) } : l)))
  const liste = active?.items || []
  const budget = active?.budget || 0
  const setListe = fn => majActive(l => ({ items: typeof fn === 'function' ? fn(l.items) : fn }))
  const setBudget = v => majActive(() => ({ budget: v }))
  const nouvelleListe = (nom, b = 20000) => {
    const id = nouvelId()
    setListes(ls => [...ls, { id, nom: nom || 'Nouvelle liste', budget: b, items: [] }])
    setListeId(id)
  }
  const supprimerListe = id => {
    setListes(ls => {
      const reste = ls.filter(l => l.id !== id)
      if (id === listeId && reste[0]) setListeId(reste[0].id)
      return reste.length ? reste : LISTE_VIDE()
    })
  }
  const [favoris, setFavoris] = usePersist('favoris', [])
  const [historique, setHistorique] = usePersist('historique', [])
  const [missions, setMissions] = usePersist('missions', () => aFaire(MISSIONS))
  const [missionsVendeur, setMissionsVendeur] = usePersist('missions_vendeur', () => aFaire(MISSIONS_VENDEUR))
  const [raccourcis, setRaccourcis] = usePersist('raccourcis', [])
  const ajouterRaccourci = t => { const v = t.trim(); if (v) setRaccourcis(r => (r.includes(v) ? r : [...r, v].slice(0, 8))) }
  const retirerRaccourci = t => setRaccourcis(r => r.filter(x => x !== t))
  const [voix, setVoixBrut] = usePersist('voix', true)
  const setVoix = v => { setVoixBrut(v); if (!v) { try { window.speechSynthesis.cancel() } catch { /* pas de voix */ } } }
  const [notes, setNotes] = usePersist('notes', {})
  const [arrets, setArrets] = usePersist('arrets', [])
  const dire = (texte, opts) => { if (voix) parler(texte, { langue, ...opts }) }
  const renommerListe = (id, nom) => setListes(ls => ls.map(l => (l.id === id ? { ...l, nom } : l)))

  // ---- Position et trajet ----
  const [moi, setMoi] = useState(null) // [lat, lng]
  const [precision, setPrecision] = useState(null)
  const [trajet, setTrajet] = usePersist('trajet', [])
  const [moto, setMoto] = usePersist('moto', null)
  const [enregistre, setEnregistre] = useState(false)
  const [demo, setDemo] = useState(false)
  const [debut, setDebut] = useState(null)
  const [erreurGps, setErreurGps] = useState(null)
  const [gpsIndispo, setGpsIndispo] = useState(false)
  const watchRef = useRef(null)
  const demoRef = useRef(null)
  const enregistreRef = useRef(false)
  // Pause : on ne trace plus, jusqu'à « Continuer ». motifPause = 'arret' (arrêt marqué) ou 'manuel' (bouton « Arrêter »)
  const [enPause, setEnPause] = useState(false)
  const [motifPause, setMotifPause] = useState(null)
  const pauseRef = useRef(false)
  const trajetRef = useRef(trajet)
  useEffect(() => { trajetRef.current = trajet }, [trajet])

  const moiRef = useRef(null)
  const recevoirPosition = useCallback((p, acc) => {
    moiRef.current = p
    setMoi(p); setPrecision(acc); setGpsIndispo(false)
    if (!enregistreRef.current || pauseRef.current) return
    const t = trajetRef.current
    if (!keepPoint(t[t.length - 1], p, acc)) return
    if (!t.length) setMoto(p)
    trajetRef.current = [...t, p]
    setTrajet(trajetRef.current)
  }, [setTrajet, setMoto])

  // Suit la position en continu (pour « Tu es ici » et le guidage)
  useEffect(() => {
    if (!navigator.geolocation) { setGpsIndispo(true); return }
    if (demo) return
    watchRef.current = navigator.geolocation.watchPosition(
      pos => { setErreurGps(null); recevoirPosition([pos.coords.latitude, pos.coords.longitude], pos.coords.accuracy) },
      err => { setErreurGps(err.message || 'Position indisponible'); setGpsIndispo(true) },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
    const t = setTimeout(() => setGpsIndispo(g => g || !moiRef.current), 6000)
    return () => { navigator.geolocation.clearWatch(watchRef.current); clearTimeout(t) }
  }, [demo, recevoirPosition])

  const arreterDemo = () => { clearInterval(demoRef.current); demoRef.current = null }

  const demarrerTrajet = ({ simulation = false } = {}) => {
    arreterDemo()
    trajetRef.current = []; setTrajet([]); setMoto(null); setArrets([]); setDebut(Date.now())
    pauseRef.current = false; setEnPause(false); setMotifPause(null)
    enregistreRef.current = true; setEnregistre(true); setDemo(simulation)
    if (simulation) {
      // Mode démo : la liste d'exemple, seulement si ma liste est vide
      if (!liste.length && !listes.some(l => l.id === 'demo')) {
        setListes(ls => [...ls, { id: 'demo', nom: 'Marché de samedi (démo)', budget: 50000, items: LISTE_DEMO }])
        setListeId('demo')
      }
      const depart = LIEUX_UTILES.find(l => l.id === 'parking').pos
      let i = 0
      demoRef.current = setInterval(() => {
        if (pauseRef.current) return
        if (i >= TRAJET_DEMO.length) { arreterDemo(); return }
        const [n, e] = TRAJET_DEMO[i++]
        recevoirPosition(offset(depart, n, e), 5)
      }, 400)
    }
  }

  const arreterTrajet = () => {
    arreterDemo()
    enregistreRef.current = false; setEnregistre(false)
    pauseRef.current = false; setEnPause(false); setMotifPause(null)
    const t = trajetRef.current
    if (t.length > 1) setHistorique(h => [{ id: Date.now(), date: new Date().toISOString(), longueur: pathLength(t), points: t }, ...h].slice(0, 20))
    // Le trajet aide à cartographier les allées (envoyé sans nom, seulement les points)
    if (serveur.uid && t.length > 5 && !demo) envoyerReleve(t, arrets.map(a => ({ type: 'arret', pos: a.pos, nom: a.nom })), pathLength(t)).catch(() => {})
  }

  const quitterDemo = () => { arreterDemo(); setDemo(false) }
  const moiEffectif = moi || (gpsIndispo ? POSITION_SIMULEE : null)
  const marquerArret = () => {
    const p = moiEffectif || trajetRef.current[trajetRef.current.length - 1]
    if (!p) return
    setArrets(a => [...a, { id: Date.now(), pos: p, nom: 'Arrêt ' + (a.length + 1) }])
    pauseRef.current = true; setEnPause(true); setMotifPause('arret')
    try { window.speechSynthesis.cancel() } catch { /* pas de voix */ }
  }
  const mettreEnPause = () => { if (!enregistreRef.current) return; pauseRef.current = true; setEnPause(true); setMotifPause('manuel') }
  const poursuivre = () => { pauseRef.current = false; setEnPause(false); setMotifPause(null) }
  const effacerArrets = () => setArrets([])

  const boutique = id => boutiques.find(b => b.id === id)

  // 0. Au démarrage : on retire la liste, les favoris et les raccourcis d'exemple d'une ancienne version
  useEffect(() => {
    setListes(ls => {
      const reste = ls.filter(l => !estListeExemple(l))
      if (reste.length === ls.length) return ls
      const nettes = reste.length ? reste : LISTE_VIDE()
      setListeId(nettes[0].id)
      return nettes
    })
    setFavoris(f => (f.length === 1 && f[0] === 'b1' ? [] : f))
    setRaccourcis(r => (r.join('|') === 'Pagnes|Chaussures|Épices' ? [] : r))
    setMissions(ms => (ms.some(m => m.detail === 'Fait') ? aFaire(ms) : ms))
    setMaBoutiqueId(id => (id === 'b1' && !compteLocal ? null : id))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 1. Au démarrage : identité anonyme, boutiques et coups de cœur partagés
  useEffect(() => {
    if (!supabase) return
    let fini = false
    ;(async () => {
      try {
        const s = await sessionActuelle() // pas de compte anonyme ici : seulement « Continuer sans compte »
        const uid = s?.uid || null
        const [bs, cs] = await Promise.all([chargerBoutiques(), chargerCoeurs()])
        if (fini) return
        if (bs.length) {
          setBoutiques(bs)
          dernierEnvoi.current = Object.fromEntries(bs.map(b => [b.id, JSON.stringify(versLigne(b))]))
          // Une boutique qui n'est pas à moi (ex. démo b1) ne peut pas être « ma boutique »
          setMaBoutiqueId(id => { const b = bs.find(x => x.id === id); return b && uid && b.proprietaire !== uid ? null : id })
        }
        setCoeursServeur(cs); setMesVotes(cs.votes)
        setServeur({ etat: 'synchro', uid, anonyme: s ? s.anonyme : true, erreur: null, envoi: false })
      } catch (e) {
        if (!fini) setServeur({ etat: 'erreur', uid: null, erreur: signaler(e), envoi: false })
      }
    })()
    // Connexion / déconnexion (y compris par le lien reçu par e-mail) : on suit la session
    const { data: abo } = supabase.auth.onAuthStateChange((evt, session) => {
      if (evt === 'INITIAL_SESSION' || evt === 'TOKEN_REFRESHED') return
      const u = session?.user
      setServeur(sv => (sv.etat === 'synchro' ? { ...sv, uid: u?.id || null, anonyme: u ? !!u.is_anonymous : true } : sv))
    })
    return () => { fini = true; abo.subscription.unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** Remise à zéro de tout ce qui appartient au compte (les boutiques du marché restent).
   *  Appelée pour un nouveau compte, un autre compte et la déconnexion. */
  const reinitialiserDonneesPerso = () => {
    const l = LISTE_VIDE() // une « Ma liste » vide, budget 0
    setUser(null); setListes(l); setListeId(l[0].id); setFavoris([]); setHistorique([]); setInterets({}); setActivites([])
    setMissions(aFaire(MISSIONS)); setMissionsVendeur(aFaire(MISSIONS_VENDEUR)); setRaccourcis([]); setNotes({}); setArrets([])
    trajetRef.current = []; setTrajet([]); setMoto(null); setMaBoutiqueId(null); setMesVotes({})
  }
  /** Après une connexion réussie : si c'est un autre compte que celui du téléphone, on part de zéro */
  const ouvrirSession = (uid, infos) => {
    if (compteLocal !== uid) { reinitialiserDonneesPerso(); setCompteLocal(uid) }
    setUser({ prenom: '', tel: '', role: 'acheteur', ...infos, verifie: true })
    setServeur(sv => ({ ...sv, uid, anonyme: false }))
  }
  const seDeconnecter = async () => {
    await deconnecter()
    reinitialiserDonneesPerso(); setCompteLocal(null); setCompteCharge(null)
    setServeur(sv => ({ ...sv, uid: null, anonyme: true }))
  }
  /** Supprime ma boutique : en ligne (ligne + photos), puis sur le téléphone */
  const supprimerMaBoutique = async () => {
    const id = maBoutiqueId
    if (!id) return
    if (supabase && serveur.etat === 'synchro' && serveur.uid) await supprimerBoutique(id, serveur.uid)
    delete dernierEnvoi.current[id]
    setMaBoutiqueId(null)
    setBoutiques(bs => bs.filter(b => b.id !== id))
  }
  const continuerSansCompte = () => {
    if (supabase) identite().then(uid => setServeur(sv => ({ ...sv, uid, anonyme: true }))).catch(() => { /* on reste en lecture seule */ })
  }

  // 1 bis. Vrai compte connecté : profil, listes, favoris et boutique du vendeur relus sur le serveur
  useEffect(() => {
    const uid = serveur.uid
    if (serveur.etat !== 'synchro' || !uid || serveur.anonyme || compteCharge === uid) return
    let fini = false
    chargerCompte(uid).then(c => {
      if (fini) return
      if (compteLocal !== uid) { reinitialiserDonneesPerso(); setCompteLocal(uid) } // ex. connexion par le lien de l'e-mail
      const p = c.profil
      setUser(u => ({
        ...(u || {}), prenom: p?.prenom || u?.prenom || c.meta.prenom || '', tel: p?.telephone || u?.tel || '',
        email: c.email.endsWith('@tel.assime.app') ? '' : c.email, role: p?.role || u?.role || c.meta.role || 'acheteur', verifie: true,
      }))
      if (Array.isArray(p?.favoris) && p.favoris.length) setFavoris(p.favoris)
      if (c.listes.length) { setListes(c.listes); setListeId(c.listes[0].id) }
      if (c.boutique) setMaBoutiqueId(c.boutique)
      setCompteCharge(uid)
    }).catch(e => { if (!fini) setServeur(sv => ({ ...sv, erreur: signaler(e) })) })
    return () => { fini = true }
  }, [serveur.etat, serveur.uid, serveur.anonyme, compteCharge]) // eslint-disable-line react-hooks/exhaustive-deps

  // 1 ter. Mes listes modifiées → envoyées au serveur, 1 s après la dernière modification
  const listesEnvoyees = useRef('')
  useEffect(() => {
    if (!serveur.uid || compteCharge !== serveur.uid) return
    const signature = serveur.uid + JSON.stringify(listes)
    if (listesEnvoyees.current === signature) return
    const minuteur = setTimeout(() => {
      enregistrerListes(listes, serveur.uid).then(() => { listesEnvoyees.current = signature })
        .catch(e => setServeur(sv => ({ ...sv, erreur: signaler(e) })))
    }, 1000)
    return () => clearTimeout(minuteur)
  }, [listes, serveur.uid, compteCharge])

  // 2. Temps réel : une boutique ou un vote change sur un autre téléphone → on recharge
  useEffect(() => {
    if (serveur.etat !== 'synchro') return
    let minuteur
    const recharger = () => {
      clearTimeout(minuteur)
      minuteur = setTimeout(async () => {
        try { const bs = await chargerBoutiques(); setBoutiques(bs) } catch { /* réseau */ }
        rafraichirCoeurs()
      }, 600)
    }
    const fin = abonner(recharger)
    const sondage = setInterval(rafraichirCoeurs, 60000)
    return () => { fin(); clearInterval(sondage); clearTimeout(minuteur) }
  }, [serveur.etat, rafraichirCoeurs, setBoutiques])

  // 3. Ma boutique modifiée → envoyée au serveur (photos comprises), 0,8 s après la dernière modification
  useEffect(() => {
    if (serveur.etat !== 'synchro' || !maBoutiqueId) return
    const b = boutiques.find(x => x.id === maBoutiqueId)
    if (!b || (b.proprietaire && b.proprietaire !== serveur.uid)) return
    const signature = JSON.stringify(versLigne(b))
    if (dernierEnvoi.current[b.id] === signature) return
    const minuteur = setTimeout(async () => {
      setServeur(s => ({ ...s, envoi: true, message: null }))
      try {
        const enregistree = await enregistrerBoutique(b, serveur.uid)
        dernierEnvoi.current[enregistree.id] = JSON.stringify(versLigne(enregistree))
        setBoutiques(bs => bs.map(x => (x.id === enregistree.id ? enregistree : x)))
        setServeur(s => ({ ...s, envoi: false, erreur: null, message: 'serveur.boutiqueEnregistree' }))
      } catch (e) {
        setServeur(s => ({ ...s, envoi: false, erreur: signaler(e), message: null }))
      }
    }, 800)
    return () => clearTimeout(minuteur)
  }, [boutiques, maBoutiqueId, serveur.etat, serveur.uid, setBoutiques])

  // 4. Profil (prénom, téléphone, rôle, favoris) enregistré sur le serveur, une fois le compte chargé
  useEffect(() => {
    if (serveur.etat === 'synchro' && user?.verifie && serveur.uid && compteCharge === serveur.uid) enregistrerProfil(user, serveur.uid, favoris).catch(() => {})
  }, [user, favoris, serveur.etat, serveur.uid, compteCharge])
  const points = missions.filter(m => m.fait).reduce((s, m) => s + m.points, 0)

  const value = {
    user, setUser, langue, setLangue, apparence, setApparence, t, tc, zoneDe, lieuTraduit, ouvrirSession, seDeconnecter, continuerSansCompte, compteCharge, reinitialiserDonneesPerso,
    boutiques, setBoutiques, boutique, maBoutiqueId, setMaBoutiqueId, supprimerMaBoutique,
    coeursDe, voter, mesVotes, serveur, interets, noterInteret, activites, setActivites,
    liste, setListe, budget, setBudget, favoris, setFavoris,
    listes, listeActive: active, setListeId, nouvelleListe, supprimerListe,
    historique, missions, setMissions, points,
    moi: moiEffectif, simule: !moi && gpsIndispo, gpsIndispo, positionOuMarche: moiEffectif || MARCHE, precision, erreurGps,
    voix, setVoix, dire, notes, missionsVendeur, setMissionsVendeur, raccourcis, ajouterRaccourci, retirerRaccourci, setNotes, arrets, marquerArret, enPause, motifPause, mettreEnPause, poursuivre, effacerArrets, renommerListe,
    trajet, moto, enregistre, demo, debut,
    demarrerTrajet, arreterTrajet, quitterDemo,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
