// État global de l'app : utilisateur, boutiques, liste, trajet en cours.
// Tout est gardé dans le téléphone (localStorage) en attendant le back-end.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { BOUTIQUES_DEMO, COEURS_DEMO, LISTE_DEMO, TRAJET_DEMO, MISSIONS, MISSIONS_VENDEUR, LIEUX_UTILES } from './data/demo'
import { MARCHE, keepPoint, offset, pathLength } from './lib/geo'
import { parler } from './lib/voix'
import { supabase, identite, chargerBoutiques, enregistrerBoutique, chargerCoeurs, envoyerVote, enregistrerProfil, envoyerReleve, abonner, versLigne } from './lib/supabase'

// Position de démonstration quand le GPS ne répond pas
const POSITION_SIMULEE = offset(MARCHE, -10, 5)

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

function usePersist(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem('assime_' + key); return s ? JSON.parse(s) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem('assime_' + key, JSON.stringify(v)) } catch { /* stockage indisponible */ } }, [key, v])
  return [v, setV]
}

export function AppProvider({ children }) {
  const [user, setUser] = usePersist('user', null) // { prenom, tel, role: 'acheteur' | 'vendeur' }
  const [langue, setLangue] = usePersist('langue', 'ewe')
  const [boutiques, setBoutiques] = usePersist('boutiques_v2', BOUTIQUES_DEMO)
  // Coups de cœur : { boutiqueId: { plus, moins } } et mon vote par boutique ('plus' | 'moins')
  const [coeurs, setCoeurs] = usePersist('coeurs', COEURS_DEMO)
  const [mesVotes, setMesVotes] = usePersist('mes_votes', {})

  // ---- Back-end (Supabase) : 'local' sans clés, sinon 'connexion' → 'synchro' (ou 'erreur' : on reste sur le téléphone) ----
  const [serveur, setServeur] = useState({ etat: supabase ? 'connexion' : 'local', uid: null, erreur: null, envoi: false })
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
  const [maBoutiqueId, setMaBoutiqueId] = usePersist('ma_boutique', 'b1')
  // Plusieurs listes de marché, chacune avec son budget
  const [listes, setListes] = usePersist('listes', [{ id: 'l1', nom: 'Marché de samedi', budget: 50000, items: LISTE_DEMO }])
  const [listeId, setListeId] = usePersist('liste_active', 'l1')
  const active = listes.find(l => l.id === listeId) || listes[0] || null
  const majActive = patch => setListes(ls => ls.map(l => (active && l.id === active.id ? { ...l, ...patch(l) } : l)))
  const liste = active?.items || []
  const budget = active?.budget || 0
  const setListe = fn => majActive(l => ({ items: typeof fn === 'function' ? fn(l.items) : fn }))
  const setBudget = v => majActive(() => ({ budget: v }))
  const nouvelleListe = (nom, b = 20000) => {
    const id = 'l' + Date.now()
    setListes(ls => [...ls, { id, nom: nom || 'Nouvelle liste', budget: b, items: [] }])
    setListeId(id)
  }
  const supprimerListe = id => {
    setListes(ls => {
      const reste = ls.filter(l => l.id !== id)
      if (id === listeId && reste[0]) setListeId(reste[0].id)
      return reste.length ? reste : [{ id: 'l' + Date.now(), nom: 'Ma liste', budget: 20000, items: [] }]
    })
  }
  const [favoris, setFavoris] = usePersist('favoris', ['b1'])
  const [historique, setHistorique] = usePersist('historique', [])
  const [missions, setMissions] = usePersist('missions', MISSIONS)
  const [missionsVendeur, setMissionsVendeur] = usePersist('missions_vendeur', MISSIONS_VENDEUR)
  const [raccourcis, setRaccourcis] = usePersist('raccourcis', ['Pagnes', 'Chaussures', 'Épices'])
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
  // Pause pendant un arrêt : on ne trace plus, jusqu'à « Poursuivre »
  const [enPause, setEnPause] = useState(false)
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
    pauseRef.current = false; setEnPause(false)
    enregistreRef.current = true; setEnregistre(true); setDemo(simulation)
    if (simulation) {
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
    pauseRef.current = false; setEnPause(false)
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
    pauseRef.current = true; setEnPause(true)
    try { window.speechSynthesis.cancel() } catch { /* pas de voix */ }
  }
  const poursuivre = () => { pauseRef.current = false; setEnPause(false) }
  const effacerArrets = () => setArrets([])

  const boutique = id => boutiques.find(b => b.id === id)

  // 1. Au démarrage : identité anonyme, boutiques et coups de cœur partagés
  useEffect(() => {
    if (!supabase) return
    let fini = false
    ;(async () => {
      try {
        const uid = await identite()
        const [bs, cs] = await Promise.all([chargerBoutiques(), chargerCoeurs()])
        if (fini) return
        if (bs.length) {
          setBoutiques(bs)
          dernierEnvoi.current = Object.fromEntries(bs.map(b => [b.id, JSON.stringify(versLigne(b))]))
          // Une boutique qui n'est pas à moi (ex. démo b1) ne peut pas être « ma boutique »
          setMaBoutiqueId(id => { const b = bs.find(x => x.id === id); return b && b.proprietaire !== uid ? null : id })
        }
        setCoeursServeur(cs); setMesVotes(cs.votes)
        setServeur({ etat: 'synchro', uid, erreur: null, envoi: false })
      } catch (e) {
        if (!fini) setServeur({ etat: 'erreur', uid: null, erreur: e.message || String(e), envoi: false })
      }
    })()
    return () => { fini = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      setServeur(s => ({ ...s, envoi: true }))
      try {
        const enregistree = await enregistrerBoutique(b, serveur.uid)
        dernierEnvoi.current[enregistree.id] = JSON.stringify(versLigne(enregistree))
        setBoutiques(bs => bs.map(x => (x.id === enregistree.id ? enregistree : x)))
        setServeur(s => ({ ...s, envoi: false, erreur: null }))
      } catch (e) {
        setServeur(s => ({ ...s, envoi: false, erreur: e.message || String(e) }))
      }
    }, 800)
    return () => clearTimeout(minuteur)
  }, [boutiques, maBoutiqueId, serveur.etat, serveur.uid, setBoutiques])

  // 4. Profil (prénom, téléphone, rôle) enregistré sur le serveur
  useEffect(() => {
    if (serveur.etat === 'synchro' && user) enregistrerProfil(user, serveur.uid).catch(() => {})
  }, [user, serveur.etat, serveur.uid])
  const points = missions.filter(m => m.fait).reduce((s, m) => s + m.points, 0) + 70

  const value = {
    user, setUser, langue, setLangue,
    boutiques, setBoutiques, boutique, maBoutiqueId, setMaBoutiqueId,
    coeursDe, voter, mesVotes, serveur, interets, noterInteret, activites, setActivites,
    liste, setListe, budget, setBudget, favoris, setFavoris,
    listes, listeActive: active, setListeId, nouvelleListe, supprimerListe,
    historique, missions, setMissions, points,
    moi: moiEffectif, simule: !moi && gpsIndispo, gpsIndispo, positionOuMarche: moiEffectif || MARCHE, precision, erreurGps,
    voix, setVoix, dire, notes, missionsVendeur, setMissionsVendeur, raccourcis, ajouterRaccourci, retirerRaccourci, setNotes, arrets, marquerArret, enPause, poursuivre, effacerArrets, renommerListe,
    trajet, moto, enregistre, demo, debut,
    demarrerTrajet, arreterTrajet, quitterDemo,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
