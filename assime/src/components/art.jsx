// Visuels : icônes Phosphor (duotone) dans des tuiles en verre, jauge circulaire, halos
import {
  DressIcon, PepperIcon, TShirtIcon, SneakerIcon, SparkleIcon, DiamondIcon, HandbagIcon, CookingPotIcon,
  BagIcon, StorefrontIcon, HeartIcon, ChurchIcon, BankIcon, BooksIcon, PillIcon, MotorcycleIcon, ToiletIcon,
  DeviceMobileIcon, DropIcon, BuildingsIcon, MapPinIcon, ThumbsUpIcon, BowlFoodIcon, HairDryerIcon, MaskHappyIcon, NeedleIcon, WarehouseIcon, MagicWandIcon, MicrophoneIcon, ListChecksIcon,
} from '@phosphor-icons/react'

export const ICONES = {
  'Pagnes wax': DressIcon, Tissus: NeedleIcon, Alimentation: BowlFoodIcon, 'Mèches et coiffure': HairDryerIcon, Artisanat: MaskHappyIcon, 'Tourisme et souvenirs': MaskHappyIcon, 'Alimentation générale': BowlFoodIcon, Grossistes: WarehouseIcon, 'Pour toi': MagicWandIcon, Épices: PepperIcon, Friperie: TShirtIcon, Chaussures: SneakerIcon,
  Cosmétiques: SparkleIcon, 'Perles et bijoux': DiamondIcon, Sacs: HandbagIcon, Vaisselle: CookingPotIcon, Autre: BagIcon,
  Tout: StorefrontIcon, Favoris: HeartIcon, Église: ChurchIcon, Banque: BankIcon, Librairie: BooksIcon, Pharmacie: PillIcon,
  Parking: MotorcycleIcon, Toilettes: ToiletIcon, 'Mobile money': DeviceMobileIcon, Eau: DropIcon, Section: BuildingsIcon,
  Hôtel: BuildingsIcon, Lieu: MapPinIcon,
  Micro: MicrophoneIcon, Liste: ListChecksIcon, // illustrations de la découverte
}

// Palette vive, utilisée à des endroits précis : [fond pastel, teinte foncée de l'icône]
export const TEINTES = {
  lilas: ['#E9E3FF', '#5A3FD6', '#B9A7FF'],
  soleil: ['#FFF0CC', '#A86A00', '#FFCB5C'],
  ciel: ['#E2EDFF', '#2457D6', '#A9C9FF'],
  rose: ['#FCE4F5', '#B02E8F', '#F6B6E6'],
  menthe: ['#DDF5E8', '#137A52', '#A8E4C6'],
  peche: ['#FFE7D6', '#D4561C', '#FFCBA6'],
}
// Catégorie inconnue (ajoutée par un vendeur) : lilas par défaut
const TEINTE_DE = {
  'Pagnes wax': 'lilas', Tissus: 'rose', Alimentation: 'menthe', 'Mèches et coiffure': 'rose', Artisanat: 'soleil', 'Tourisme et souvenirs': 'soleil', 'Alimentation générale': 'menthe', Grossistes: 'ciel', 'Pour toi': 'menthe', Épices: 'peche', Friperie: 'ciel', Chaussures: 'soleil', Cosmétiques: 'rose',
  'Perles et bijoux': 'menthe', Sacs: 'peche', Vaisselle: 'ciel', Autre: 'lilas', Tout: 'lilas', Favoris: 'rose',
  Église: 'lilas', Banque: 'ciel', Librairie: 'soleil', Pharmacie: 'menthe', Parking: 'peche', Toilettes: 'ciel',
  'Mobile money': 'soleil', Eau: 'ciel', Section: 'menthe', Hôtel: 'lilas', Lieu: 'peche', Micro: 'menthe', Liste: 'ciel',
}
export const teinte = cat => TEINTES[TEINTE_DE[cat] || 'lilas']

/** Icône (Phosphor duotone) pour une catégorie ou un lieu */
export function Emoji({ cat, size = 24, className = '', color = 'currentColor', weight = 'duotone' }) {
  const C = ICONES[cat] || ICONES.Autre
  return <C size={size} weight={weight} color={color} className={className} aria-hidden="true" />
}

/** Tuile blanche avec icône colorée. Sélectionnée = noire, icône blanche. */
export function GlassIcon({ cat, size = 48, actif = false, className = '' }) {
  const fonce = teinte(cat)[1]
  return (
    <span className={'tile ' + (actif ? 'tile-on ' : '') + className} style={{ width: size, height: size, borderRadius: size * 0.32 }}>
      <Emoji cat={cat} size={Math.round(size * 0.52)} color={actif ? '#fff' : fonce} weight={actif ? 'fill' : 'duotone'} />
    </span>
  )
}

/** Visuel d'une boutique ou d'un article : la photo du vendeur si elle existe, sinon un fond vert très clair */
export function Wax({ image, className = '', children, style }) {
  return (
    <div className={(/\babsolute\b/.test(className) ? '' : 'relative ') + 'overflow-hidden bg-[#E6F4EC] ' + className} style={style}>
      {image && <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      {children}
    </div>
  )
}

/** Nombre de coups de cœur affichés (pouces levés − pouces baissés, jamais négatif) */
export function Coeurs({ n, className = '' }) {
  return n > 0
    ? <span className={'inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white text-[#137A52] text-[11px] font-bold ' + className}><ThumbsUpIcon size={13} weight="fill" />{n}</span>
    : <span className={'inline-flex items-center h-6 px-2 rounded-full bg-white/90 text-muted text-[11px] font-semibold ' + className}>Pas encore de coup de cœur</span>
}

/** Jauge circulaire (pourcentage 0–100) */
export function Ring({ pct = 0, size = 84, stroke = 9, track = 'rgba(22,24,29,.1)', color = '#16181D', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, pct)) / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">{children}</div>
    </div>
  )
}
