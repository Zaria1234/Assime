// Réduit une photo choisie sur le téléphone et la renvoie en texte (data URL).
// En attendant le back-end, l'image est gardée dans le téléphone (localStorage), d'où la petite taille.
export function lireImage(fichier, max = 720, qualite = 0.72) {
  return new Promise((resolve, reject) => {
    if (!fichier) return reject(new Error('Aucun fichier'))
    const lecteur = new FileReader()
    lecteur.onerror = () => reject(lecteur.error)
    lecteur.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image illisible'))
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', qualite))
      }
      img.src = lecteur.result
    }
    lecteur.readAsDataURL(fichier)
  })
}
