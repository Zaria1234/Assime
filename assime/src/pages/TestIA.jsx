// Page de diagnostic : vérifie que Gemini répond (clé, modèle, réseau) et montre la réponse brute.
import { useState } from 'react'
import { useApp } from '../store'
import { Screen, TopBar } from '../components/ui'
import { contexteIA, NOMS_OUTILS } from '../lib/ia'
import { LIEUX_UTILES } from '../data/demo'

const EXEMPLES = ['Je cherche du riz en gros pas cher', 'Où le riz est le moins cher ?', 'Où est la pharmacie ?', 'Tu connais Ramco ?', 'Où trouver des mèches ?', "J'ai trouvé les chaussures à 8 000", 'Ajoute du savon', 'Ramène-moi à ma moto']

function diagnostic(statut, json) {
  if (statut === 200) return { ok: true, titre: 'Gemini répond ✓', texte: 'La clé et le modèle fonctionnent.' }
  const e = (json?.erreur || '') + ' ' + (json?.detail || '')
  if (statut === 0 || (statut === 404 && !json?.erreur)) return { titre: 'Serveur introuvable', texte: "Pas de fonction /api/ia ici. Teste sur ton lien Vercel ou avec « npm run dev » sur ton ordinateur (l'aperçu Claude ne peut pas l'appeler)." }
  if (/manquante/.test(e)) return { titre: 'Clé absente', texte: 'Ajoute GEMINI_API_KEY dans .env.local (ordinateur) ou dans Vercel → Settings → Environment Variables, puis redéploie.' }
  if (/\b(400|401|403)\b/.test(e) && /key|API_KEY|permission|invalid/i.test(e)) return { titre: 'Clé refusée', texte: 'Google refuse la clé. Recopie-la depuis aistudio.google.com/apikey (sans espace).' }
  if (/\b404\b/.test(e)) return { titre: 'Modèle introuvable', texte: 'Mets dans GEMINI_MODEL un nom de modèle affiché dans AI Studio.' }
  if (/\b429\b/.test(e)) return { titre: 'Quota dépassé', texte: "Trop de demandes sur l'offre gratuite. Attends une minute et réessaie." }
  if (/fetch failed|ENOTFOUND|ECONN/i.test(e)) return { titre: 'Pas de connexion à Google', texte: "Le serveur n'arrive pas à joindre Gemini. Vérifie Internet." }
  return { titre: 'Erreur ' + statut, texte: e.trim() || 'Erreur inconnue.' }
}

export default function TestIA() {
  const { boutiques, moi, liste, budget, moto, coeursDe } = useApp()
  const [message, setMessage] = useState(EXEMPLES[0])
  const [resultat, setResultat] = useState(null)
  const [charge, setCharge] = useState(false)

  const tester = async texte => {
    const m = (texte ?? message).trim()
    if (!m) return
    setMessage(m); setCharge(true); setResultat(null)
    const debut = performance.now()
    let statut, json = null
    try {
      const r = await fetch('/api/ia', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contexteIA({ message: m, boutiques, lieux: LIEUX_UTILES, position: moi, liste, budget, moto, coeursDe })) })
      statut = r.status
      try { json = await r.json() } catch { json = null }
    } catch { statut = 0 }
    setResultat({ statut, json, ms: Math.round(performance.now() - debut), diag: diagnostic(statut, json) })
    setCharge(false)
  }

  const nomDe = id => boutiques.find(b => b.id === id)?.nom || id
  return (
    <Screen>
      <TopBar title="Tester l'IA" sub="Diagnostic Gemini" back="/profil" />
      <div className="flex-1 min-h-0 scroll no-scrollbar px-5 pb-6 flex flex-col gap-4">
        <form onSubmit={e => { e.preventDefault(); tester() }} className="flex flex-col gap-2.5">
          <label htmlFor="msg" className="label">Phrase à envoyer</label>
          <input id="msg" className="field" value={message} onChange={e => setMessage(e.target.value)} />
          <button type="submit" disabled={charge} className="btn bg-brand text-white h-12">{charge ? 'Gemini réfléchit…' : 'Tester'}</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {EXEMPLES.map(x => <button key={x} type="button" onClick={() => tester(x)} disabled={charge} className="h-9 px-3 rounded-full bg-white border border-line text-[12px] font-semibold">{x}</button>)}
        </div>

        {resultat && (
          <>
            <div className={'rounded-[20px] p-4 ' + (resultat.diag.ok ? 'bg-[#E6F4EC] text-[#0F5440]' : 'bg-[#FFF1E6] text-[#8A3B12]')}>
              <div className="font-bold text-[16px]">{resultat.diag.titre}</div>
              <div className="text-[13px] mt-1 leading-relaxed">{resultat.diag.texte}</div>
              <div className="text-[11px] mt-2 opacity-80">Statut {resultat.statut || '—'} · {resultat.ms} ms{resultat.json?.modele ? ' · modèle ' + resultat.json.modele : ''}</div>
            </div>
            {resultat.diag.ok && (
              <div className="card p-4 flex flex-col gap-3">
                <div><div className="section-title">Réponse lue à voix haute</div><p className="text-[15px] mt-1.5 leading-relaxed">{resultat.json.reponse}</p></div>
                {resultat.json.boutiques?.length > 0 && <div><div className="section-title">Boutiques proposées</div><p className="text-[14px] mt-1.5">{resultat.json.boutiques.map(nomDe).join(', ')}</p></div>}
                {resultat.json.lieux?.length > 0 && <div><div className="section-title">Repères proposés</div><p className="text-[14px] mt-1.5">{resultat.json.lieux.map(id => LIEUX_UTILES.find(l => l.id === id)?.nom || id).join(', ')}</p></div>}
                {resultat.json.lieux_lome?.length > 0 && <div><div className="section-title">Lieux trouvés à Lomé</div><p className="text-[14px] mt-1.5">{resultat.json.lieux_lome.map(l => l.nom).join(', ')}</p></div>}
                <div><div className="section-title">Outils utilisés par Gemini</div><p className="text-[14px] mt-1.5">{resultat.json.outils?.length ? resultat.json.outils.map(o => NOMS_OUTILS[o] || o).join(' → ') : 'aucun'}</p></div>
                {resultat.json.operations?.length > 0 && <div><div className="section-title">Changements dans la liste</div><ul className="text-[14px] mt-1.5 list-disc pl-5">{resultat.json.operations.map((o, i) => <li key={i}>{o.type} · {o.nom}{o.prix ? ' · ' + o.prix + ' F' : ''}</li>)}</ul></div>}
                <div className="text-[12px] text-muted">Budget annoncé : {resultat.json.parler_budget ? 'oui' : 'non'} · Action : {resultat.json.action}</div>
              </div>
            )}
            <details className="card p-4">
              <summary className="text-[13px] font-semibold cursor-pointer">Réponse brute (JSON)</summary>
              <pre className="mt-3 text-[11px] whitespace-pre-wrap break-all text-muted">{JSON.stringify(resultat.json, null, 2)}</pre>
            </details>
          </>
        )}
        <p className="text-[12px] text-muted leading-relaxed">Cette page appelle /api/ia directement, sans repli sur l'IA locale, pour voir la vraie erreur. Elle marche sur ton lien Vercel ou avec « npm run dev », pas dans l'aperçu Claude.</p>
      </div>
    </Screen>
  )
}
