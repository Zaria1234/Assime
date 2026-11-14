import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

// En local (npm run dev), sert /api/ia et /api/compte comme le fera Vercel en ligne.
// Les clés sont lues dans .env.local (GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY) et restent côté serveur.
const ROUTES = { '/api/ia': ['/api/ia.js', 'repondreIA'], '/api/compte': ['/api/compte.js', 'traiterCompte'] }
function apiLocale(env) {
  return {
    name: 'assime-api-locale',
    configureServer(server) { brancher(server) },
    configurePreviewServer(server) { brancher(server) }, // aussi avec npm run preview (version de production)
  }
  function brancher(server) {
      for (const [route, [fichier, fonction]] of Object.entries(ROUTES)) server.middlewares.use(route, async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{"erreur":"POST uniquement"}') }
        let brut = ''
        for await (const morceau of req) brut += morceau
        try {
          const module = server.ssrLoadModule ? await server.ssrLoadModule(fichier) : await import(pathToFileURL(path.join(process.cwd(), fichier)).href)
          const { statut, json } = await module[fonction](JSON.parse(brut || '{}'), env)
          res.statusCode = statut; res.end(JSON.stringify(json))
        } catch (e) {
          res.statusCode = 500; res.end(JSON.stringify({ erreur: String(e?.message || e) }))
        }
      })
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // toutes les variables, y compris sans préfixe VITE_
  return {
    plugins: [react(), tailwindcss(), apiLocale(env)],
    build: {
      // Leaflet + React + les icônes dépassent un peu 500 ko : normal pour cette app.
      chunkSizeWarningLimit: 700,
    },
  }
})
