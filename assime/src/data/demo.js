// Données de démonstration — à remplacer par Supabase (back-end)
import { MARCHE, offset } from '../lib/geo.js'

export const CATEGORIES = ['Pagnes wax', 'Tissus', 'Épices', 'Alimentation', 'Mèches et coiffure', 'Artisanat', 'Friperie', 'Chaussures', 'Cosmétiques', 'Perles et bijoux', 'Sacs', 'Vaisselle', 'Autre']

const p = (n, e) => offset(MARCHE, n, e)

// Positions approximatives : à corriger avec le relevé terrain
export const BOUTIQUES_DEMO = [
  { id: 'b1', nom: 'Boutique de pagnes 1', categorie: 'Pagnes wax', zone: 'Zone des pagnes', pos: p(-20, 40), horaires: '7h – 18h', repere: 'À gauche après le carrefour C4, en face des sacs.', whatsapp: '', verifiee: true,
    articles: [{ nom: 'Wax 6 yards', prix: 15000, stock: true }, { nom: 'Wax 12 yards', prix: 28000, stock: true }, { nom: 'Bazin', prix: 9000, stock: false }] },
  { id: 'b2', nom: 'Boutique de pagnes 2', categorie: 'Pagnes wax', zone: 'Zone des pagnes', pos: p(-35, 60), horaires: '8h – 18h', repere: 'Deuxième allée, côté gauche.', whatsapp: '', verifiee: false, articles: [{ nom: 'Wax hollandais', prix: 22000, stock: true }] },
  { id: 'b3', nom: 'Épices du marché', categorie: 'Épices', zone: 'Zone des épices', pos: p(45, -10), horaires: '6h – 17h', repere: "Près de l'entrée nord.", whatsapp: '', verifiee: true, articles: [{ nom: 'Poivre', prix: 1000, stock: true }, { nom: 'Gingembre', prix: 1500, stock: true }] },
  { id: 'b4', nom: 'Chaussures pour tous', categorie: 'Chaussures', zone: 'Zone des chaussures', pos: p(-10, -45), horaires: '8h – 19h', repere: 'Allée principale.', whatsapp: '', verifiee: true, articles: [{ nom: 'Sandales enfant', prix: 8000, stock: true }] },
  { id: 'b5', nom: 'Sacs et maroquinerie', categorie: 'Sacs', zone: 'Zone des sacs', pos: p(15, 55), horaires: '8h – 18h', repere: 'En face des pagnes.', whatsapp: '', verifiee: false, articles: [{ nom: 'Sac à main', prix: 12000, stock: true }] },
  { id: 'b6', nom: 'Perles de Lomé', categorie: 'Perles et bijoux', zone: 'Zone des perles', pos: p(30, 20), horaires: '9h – 18h', repere: 'Petite allée couverte.', whatsapp: '', verifiee: false, articles: [{ nom: 'Collier de perles', prix: 5000, stock: true }] },
  { id: 'b7', nom: 'Alimentation Dagbé', categorie: 'Alimentation', zone: 'Zone alimentation', pos: p(50, 20), horaires: '6h – 19h', repere: 'Près de la pharmacie.', whatsapp: '', verifiee: true,
    articles: [{ nom: 'Riz 5 kg', prix: 3500, stock: true }, { nom: 'Huile 1 L', prix: 1300, stock: true }, { nom: 'Lait en poudre', prix: 2500, stock: true }] },
  { id: 'b8', nom: 'Grossiste Akpénè', categorie: 'Alimentation', gros: true, zone: 'Zone alimentation', pos: p(60, -25), horaires: '6h – 17h', repere: 'Grand entrepôt bleu, côté rue.', whatsapp: '', verifiee: true,
    articles: [{ nom: 'Riz sac 50 kg', prix: 27000, stock: true }, { nom: 'Huile bidon 20 L', prix: 23000, stock: true }, { nom: 'Sucre carton', prix: 18000, stock: true }] },
  { id: 'b9', nom: 'Mèches Belle Afi', categorie: 'Mèches et coiffure', gros: true, zone: 'Zone beauté', pos: p(-40, 20), horaires: '8h – 19h', repere: 'Allée des cosmétiques, 3e stand.', whatsapp: '', verifiee: true,
    articles: [{ nom: 'Mèche brésilienne', prix: 12000, stock: true }, { nom: 'Paquet de tresses (gros)', prix: 9000, stock: true }] },
  { id: 'b10', nom: 'Salon Coiffure Elom', categorie: 'Mèches et coiffure', zone: 'Zone beauté', pos: p(-48, 8), horaires: '8h – 20h', repere: 'À côté de Mèches Belle Afi.', whatsapp: '', verifiee: false,
    articles: [{ nom: 'Tresses', prix: 5000, stock: true }, { nom: 'Pose de perruque', prix: 3000, stock: true }] },
  { id: 'b11', nom: 'Souvenirs du Togo', categorie: 'Artisanat', zone: 'Zone artisanat', pos: p(20, -40), horaires: '9h – 18h', repere: 'Près de la cathédrale.', whatsapp: '', verifiee: true,
    articles: [{ nom: 'Masque sculpté', prix: 8000, stock: true }, { nom: 'Panier tressé', prix: 4000, stock: true }] },
  { id: 'b12', nom: 'Beauté Naturelle', categorie: 'Cosmétiques', zone: 'Zone beauté', pos: p(-30, 30), horaires: '8h – 18h', repere: 'Allée des cosmétiques.', whatsapp: '', verifiee: false,
    articles: [{ nom: 'Beurre de karité', prix: 1500, stock: true }, { nom: 'Savon noir', prix: 500, stock: true }] },
]

// Coups de cœur de démonstration : pouces levés (plus) et baissés (moins) déjà reçus.
// Affiché aux visiteurs : plus − moins (jamais en dessous de 0). Les « moins » ne sont vus que par le vendeur.
export const COEURS_DEMO = { b1: { plus: 24, moins: 2 }, b2: { plus: 6, moins: 1 }, b3: { plus: 41, moins: 3 }, b4: { plus: 12, moins: 0 }, b5: { plus: 3, moins: 3 }, b6: { plus: 9, moins: 1 },
  b7: { plus: 18, moins: 2 }, b8: { plus: 33, moins: 4 }, b9: { plus: 27, moins: 1 }, b10: { plus: 8, moins: 0 }, b11: { plus: 15, moins: 0 }, b12: { plus: 0, moins: 1 } }

// Sections d'activité proposées par l'IA. « pour » = activités de l'utilisateur qui déclenchent la section.
export const SECTIONS = [
  { id: 'tourisme', titre: 'Tourisme et souvenirs', sous: 'À ramener du Togo', cats: ['Artisanat', 'Perles et bijoux', 'Pagnes wax'], pour: ['tourisme'] },
  { id: 'alimentation', titre: 'Alimentation générale', sous: 'Courses de la maison', cats: ['Alimentation', 'Épices'], pour: ['maison', 'restauration'] },
  { id: 'grossistes', titre: 'Grossistes en alimentation', sous: 'Sacs, bidons, cartons', cats: ['Alimentation'], gros: true, pour: ['restauration', 'revente'] },
  { id: 'meches', titre: 'Mèches et coiffure', sous: 'Mèches en gros, salons', cats: ['Mèches et coiffure'], pour: ['coiffure', 'beaute'] },
  { id: 'beaute', titre: 'Beauté et cosmétiques', sous: 'Karité, savon, crèmes', cats: ['Cosmétiques', 'Mèches et coiffure'], pour: ['coiffure', 'beaute'] },
  { id: 'mode', titre: 'Mode et couture', sous: 'Pagnes, tissus, chaussures', cats: ['Pagnes wax', 'Tissus', 'Chaussures', 'Sacs', 'Friperie'], pour: ['couture', 'revente'] },
]
export const ACTIVITES = [
  { id: 'maison', nom: 'Courses maison' }, { id: 'tourisme', nom: 'Touriste' }, { id: 'restauration', nom: 'Restauration' },
  { id: 'coiffure', nom: 'Coiffure' }, { id: 'revente', nom: 'Revendeur·se' }, { id: 'couture', nom: 'Couture' },
]

// Repères du marché. Sources : annuaires en ligne (GoAfrica) et guides.
// ATTENTION : positions APPROXIMATIVES, à corriger lors du relevé terrain.
export const LIEUX_UTILES = [
  { id: 'cathedrale', nom: 'Cathédrale du Sacré-Cœur', type: 'Église', note: 'Grand repère rouge au cœur du marché', pos: p(15, -15) },
  { id: 'ecobank', nom: 'Ecobank Assigamé', type: 'Banque', note: 'Rue du Commerce', pos: p(35, 35) },
  { id: 'bonpasteur', nom: 'Librairie-papeterie Bon Pasteur', type: 'Librairie', note: "Rue du Commerce, en face d'Ecobank Assigamé", pos: p(38, 45) },
  { id: 'pharmacie', nom: 'Pharmacie du Grand Marché', type: 'Pharmacie', note: 'Angle rue du Grand Marché et av. de la Libération', pos: p(70, 40) },
  { id: 'atipoji', nom: 'Section Atipoji', type: 'Section', note: 'Une des trois sections du Grand Marché', pos: p(-30, -40) },
  { id: 'asigame', nom: 'Section Asigamé', type: 'Section', note: 'Une des trois sections du Grand Marché', pos: p(0, 0) },
  { id: 'assivito', nom: 'Section Assivito', type: 'Section', note: 'Une des trois sections du Grand Marché', pos: p(-20, 60) },
  { id: 'parking', nom: 'Parking motos', type: 'Parking', note: 'À relever sur place', pos: p(-60, -60) },
  { id: 'toilettes', nom: 'Toilettes', type: 'Toilettes', note: 'À relever sur place', pos: p(10, -30) },
  { id: 'momo', nom: 'Mobile money', type: 'Mobile money', note: 'À relever sur place', pos: p(-5, 15) },
  { id: 'eau', nom: "Point d'eau", type: 'Eau', note: 'À relever sur place', pos: p(25, -50) },
]

export const ZONES = [
  { id: 'pagnes', nom: 'Zone des pagnes wax', categorie: 'Pagnes wax', distanceMin: 4 },
  { id: 'epices', nom: 'Zone des épices', categorie: 'Épices', distanceMin: 3 },
  { id: 'chaussures', nom: 'Zone des chaussures', categorie: 'Chaussures', distanceMin: 2 },
]

export const LISTE_DEMO = [
  { id: 1, nom: 'Pagnes wax 6 yards', prix: 15000, fait: true },
  { id: 2, nom: 'Épices (poivre, gingembre)', prix: 2500, fait: true },
  { id: 3, nom: 'Chaussures enfant', prix: null, fait: false },
  { id: 4, nom: 'Sac à main', prix: null, fait: false },
  { id: 5, nom: 'Perles', prix: null, fait: false },
]

export const MISSIONS = [
  { id: 'm1', titre: 'Enregistre ton premier trajet', detail: 'Fait', points: 50, fait: true },
  { id: 'm2', titre: "Photographie l'allée des pagnes", detail: 'Pour la visite à distance', points: 20 },
  { id: 'm3', titre: 'Confirme 3 boutiques près de toi', detail: 'Est-elle toujours là ?', points: 30 },
  { id: 'm4', titre: 'Signale un passage bloqué', detail: 'Travaux, inondation, foule', points: 10 },
]

export const MISSIONS_VENDEUR = [
  { id: 'v1', titre: 'Place ta boutique sur la carte', detail: 'Mets-toi devant ton stand', points: 50 },
  { id: 'v2', titre: 'Ajoute ton numéro WhatsApp', detail: 'Les clients pourront te joindre', points: 20 },
  { id: 'v3', titre: 'Ajoute 3 photos de tes articles', detail: 'Une boutique avec photos attire plus', points: 30 },
  { id: 'v4', titre: 'Mets les prix de 5 articles', detail: "L'IA proposera ta boutique", points: 30 },
  { id: 'v5', titre: 'Invite une voisine vendeuse', detail: 'Plus de boutiques, plus de clients', points: 40 },
]

// Trajet simulé (mètres nord, est) pour le mode démo — contient une boucle
export const TRAJET_DEMO = [[0,0],[0,10],[0,20],[0,30],[0,40],[5,45],[15,45],[25,45],[35,45],[45,45],[45,35],[45,25],[40,20],[30,20],[20,20],[10,20],[0,20],[-5,25],[-15,30],[-25,35],[-35,40],[-45,40],[-55,40],[-60,30]]
