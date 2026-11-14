// Voix : reconnaissance (micro) et synthèse (haut-parleur) du navigateur.
// L'éwé et le mina ne sont pas encore reconnus par les navigateurs :
// pour le guidage, on jouera des fichiers audio enregistrés (public/audio/ewe/*.mp3).

export const microDisponible = () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

/** Écoute une phrase et la renvoie en texte (français). */
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

/** Lit un texte à voix haute. Pour l'éwé : fichier audio s'il existe. */
export function parler(texte, { langue = 'fr', audio } = {}) {
  try {
    if (langue !== 'fr' && audio) { new Audio(audio).play(); return }
    const u = new SpeechSynthesisUtterance(texte)
    u.lang = 'fr-FR'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* pas de voix disponible */ }
}
