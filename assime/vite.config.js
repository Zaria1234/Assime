import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En local (npm run dev), sert /api/ia comme le fera Vercel en ligne.
// La clé est lue dans .env.local (GEMINI_API_KEY) et reste côté serveur.
function apiLocale(env) {
  return {
    name: 'assime-api-locale',
    configureServer(server) {
      server.middlewares.use('/api/ia', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('{"erreur":"POST uniquement"}') }
        let brut = ''
        for await (const morceau of req) brut += morceau
        try {
          const { repondreIA } = await server.ssrLoadModule('/api/ia.js')
          const { statut, json } = await repondreIA(JSON.parse(brut || '{}'), env)
          res.statusCode = statut; res.end(JSON.stringify(json))
        } catch (e) {
          res.statusCode = 500; res.end(JSON.stringify({ erreur: String(e?.message || e) }))
        }
      })
    },
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
