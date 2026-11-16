import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'

// Aperçu (artefact) : routeur en mémoire ; en production : vraies URL
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : BrowserRouter
import './index.css'
import { AppProvider, useApp } from './store'
import { Inscription, Connexion, Code, Role } from './pages/Entree'
import { Carte, Trajet, Retour, Recherche, Boutique, Guidage } from './pages/Navigation'
import { Explorer, Liste, Assistant, Missions, Profil } from './pages/Autres'
import IA from './pages/IA'
import Decouverte from './pages/Decouverte'
import TestIA from './pages/TestIA'
import { VendeurAccueil, VendeurBoutique, Articles } from './pages/Vendeur'

function Accueil() {
  const { user } = useApp()
  if (user?.verifie) return <Navigate to={user.role === 'vendeur' ? '/vendeur' : '/carte'} replace />
  // Pas connecté (premier passage ou après déconnexion) : les slides de découverte
  return <Decouverte />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/decouverte" element={<Decouverte />} />
          <Route path="/bienvenue" element={<Navigate to="/" replace />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/code" element={<Code />} />
          <Route path="/role" element={<Role />} />
          <Route path="/carte" element={<Carte />} />
          <Route path="/trajet" element={<Trajet />} />
          <Route path="/retour" element={<Retour />} />
          <Route path="/recherche" element={<Recherche />} />
          <Route path="/boutique/:id" element={<Boutique />} />
          <Route path="/guidage/:id" element={<Guidage />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/liste" element={<Liste />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/ia" element={<IA />} />
          <Route path="/test-ia" element={<TestIA />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/vendeur" element={<VendeurAccueil />} />
          <Route path="/vendeur/boutique" element={<VendeurBoutique />} />
          <Route path="/vendeur/articles" element={<Articles />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  </StrictMode>,
)
