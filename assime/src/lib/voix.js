// Voix : reconnaissance (micro) et synthèse (haut-parleur) du navigateur.
// Les navigateurs ne savent ni reconnaître ni lire l'éwé : en éwé, on écoute et on lit avec la voix française (fr-FR).
// En anglais : en-US.
import { voixDe } from '../i18n'

export const microDisponible = () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

/** Écoute une phrase et la renvoie en texte (lang : 'fr-FR' ou 'en-US'). */
export function ecouter(lang = 'fr-FR') {
  return new Promise((resolve, reject) => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Rec) return reject(new Error('Micro non disponible sur ce navigateur'))
    const rec = new Rec()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = e => resolve(e.results[0][0].transcript)
    rec.onerror = e => reject(new Error(e.error))
    rec.start()
  })
}

/** Lit un texte à voix haute, avec la voix de la langue choisie. Pour l'éwé : fichier audio s'il existe. */
export function parler(texte, { langue = 'fr', audio } = {}) {
  try {
    if (langue === 'ewe' && audio) { new Audio(audio).play(); return }
    const u = new SpeechSynthesisUtterance(texte)
    u.lang = voixDe(langue)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* pas de voix disponible */ }
}
