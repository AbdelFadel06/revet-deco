/**
 * Catalogue de DÉMONSTRATION.
 *
 * Seuls les prix du papier peint autocollant (2 500 F, 2 000 F dès 6) et la
 * fourchette de l'intissé (4 000 – 7 000 F) viennent de la boutique.
 * Tous les autres prix, dimensions et références sont PROVISOIRES.
 */
import type { Availability, PriceTier, Unit } from '../../lib/types'
import type { PatternStyle } from './images'
import type { SceneKind } from './scenes'

export interface DemoCategory {
  slug: string
  title: string
  /** Nom court affiché dans le menu */
  navLabel: string
  description: string
  order: number
  isSeasonal?: boolean
  /** Scène d'intérieur générée pour le visuel de la catégorie. */
  scene: SceneKind
}

export interface DemoPattern {
  code: string
  name: string
  style: PatternStyle
  availability?: Availability
  priceOverride?: number
  isFeatured?: boolean
}

export interface DemoFamily {
  slug: string
  title: string
  patterns: DemoPattern[]
}

export interface DemoProduct {
  slug: string
  title: string
  category: string
  unit: Unit
  priceTiers: PriceTier[]
  shortDescription: string
  features: string[]
  dimensions?: string
  coveragePerUnit?: number
  priceRange?: { min: number; max: number }
  isFeatured?: boolean
  /** Produit à motifs */
  families?: DemoFamily[]
  /** Produit simple : visuel généré */
  card?: { bg: string; fg: string; backdrop?: PatternStyle }
  availability?: Availability
}

const marble = (base: string, accent: string): PatternStyle => ({ kind: 'marble', base, accent })
const planks = (base: string, accent: string): PatternStyle => ({ kind: 'planks', base, accent })
const floral = (base: string, accent: string): PatternStyle => ({ kind: 'floral', base, accent })
const brick = (base: string, accent: string): PatternStyle => ({ kind: 'brick', base, accent })
const geo = (base: string, accent: string): PatternStyle => ({ kind: 'geometric', base, accent })
const tiles = (base: string, accent: string): PatternStyle => ({ kind: 'tiles', base, accent })
const wood = (base: string, accent: string): PatternStyle => ({ kind: 'wood', base, accent })
const plain = (base: string): PatternStyle => ({ kind: 'plain', base, accent: '#000000' })

export const categories: DemoCategory[] = [
  {
    slug: 'revetement-mural',
    navLabel: 'Mur',
    title: 'Revêtement mural',
    description: 'Papier peint, feuilles marbrées, panneaux 3D… Transformez vos murs sans gros travaux.',
    order: 1,
    scene: 'mur',
  },
  {
    slug: 'revetement-sol',
    navLabel: 'Sol',
    title: 'Revêtement de sol',
    description: 'Revêtement PVC, plancher à clic, faux carreaux : un sol neuf à petit prix.',
    order: 2,
    scene: 'sol',
  },
  {
    slug: 'plafond',
    navLabel: 'Plafond',
    title: 'Plafond',
    description: 'Faux staff et finitions pour un plafond élégant.',
    order: 3,
    scene: 'plafond',
  },
  {
    slug: 'deco',
    navLabel: 'Déco',
    title: 'Déco & finitions',
    description: 'Sprays de peinture, rubans décoratifs et petites touches qui changent tout.',
    order: 4,
    scene: 'deco',
  },
  {
    slug: 'noel',
    navLabel: 'Noël',
    title: 'Noël',
    description: 'Sapins, boules et fleurs pour des fêtes chaleureuses.',
    order: 5,
    isSeasonal: true,
    scene: 'noel',
  },
]

export const products: DemoProduct[] = [
  // --- Revêtement mural ------------------------------------------------------
  {
    slug: 'papier-peint-autocollant',
    title: 'Papier peint autocollant',
    category: 'revetement-mural',
    unit: 'rouleau',
    dimensions: '5 m × 60 cm',
    coveragePerUnit: 3,
    priceTiers: [
      { minQty: 1, unitPrice: 2500 },
      { minQty: 6, unitPrice: 2000 },
    ],
    shortDescription: 'Se pose en quelques minutes, sans colle ni outils. Idéal pour salon, chambre ou cuisine.',
    features: ['5 m × 60 cm (3 m²)', 'Autocollant', 'Imperméable', 'Sans colle, sans travaux'],
    isFeatured: true,
    families: [
      {
        slug: 'marbre',
        title: 'Marbre',
        patterns: [
          { code: 'PP-M01', name: 'Marbre blanc & or', style: marble('#f7f4ef', '#c69c6d'), isFeatured: true },
          { code: 'PP-M02', name: 'Marbre noir & or', style: marble('#1c1a19', '#d4af6a'), isFeatured: true },
          { code: 'PP-M03', name: 'Marbre rose & or', style: marble('#f1dcd6', '#c69c6d') },
          { code: 'PP-M04', name: 'Marbre blanc & gris', style: marble('#f5f5f3', '#8f8f8f'), availability: 'sur_commande' },
          { code: 'PP-M05', name: 'Marbre vert émeraude', style: marble('#1f4a3f', '#d9c7a0') },
        ],
      },
      {
        slug: 'lambris',
        title: 'Lambris effet bois',
        patterns: [
          { code: 'PP-L01', name: 'Lambris chêne clair', style: planks('#c89b6d', '#3a2414'), isFeatured: true },
          { code: 'PP-L02', name: 'Lambris gris', style: planks('#6f6a64', '#1f1c1a') },
          { code: 'PP-L03', name: 'Lambris noir', style: planks('#2b2724', '#0c0b0a') },
          { code: 'PP-L04', name: 'Lambris orange', style: planks('#d07a3c', '#5a2a10'), availability: 'epuise' },
          { code: 'PP-L05', name: 'Lambris terracotta', style: planks('#b4563a', '#4a1d10') },
        ],
      },
      {
        slug: 'floral',
        title: 'Floral',
        patterns: [
          { code: 'PP-F01', name: 'Fleurs terracotta', style: floral('#f3ece0', '#c56b4a') },
          { code: 'PP-F02', name: 'Fleurs dorées sur vert', style: floral('#1f3b36', '#c69c6d'), isFeatured: true },
          { code: 'PP-F03', name: 'Fleurs roses', style: floral('#fbf3ef', '#d98a9a'), availability: 'epuise' },
        ],
      },
      {
        slug: 'brique-pierre',
        title: 'Brique & pierre',
        patterns: [
          { code: 'PP-B01', name: 'Brique rouge', style: brick('#a8553a', '#d9cfc2') },
          { code: 'PP-B02', name: 'Brique blanche', style: brick('#eeeae4', '#b9b2a6') },
          { code: 'PP-B03', name: 'Pierre grise', style: brick('#8d8a85', '#5a5753'), availability: 'sur_commande' },
        ],
      },
      {
        slug: 'art-deco',
        title: 'Géométrique & Art déco',
        patterns: [
          { code: 'PP-G01', name: 'Éventails vert & or', style: geo('#1f3b36', '#c69c6d') },
          { code: 'PP-G02', name: 'Éventails noir & or', style: geo('#1a1a1a', '#c69c6d') },
          { code: 'PP-G03', name: 'Éventails crème', style: geo('#f3ece0', '#a07850') },
        ],
      },
    ],
  },
  {
    slug: 'papier-peint-intisse',
    title: 'Papier peint intissé',
    category: 'revetement-mural',
    unit: 'rouleau',
    dimensions: '10 m × 53 cm',
    coveragePerUnit: 5.3,
    priceTiers: [{ minQty: 1, unitPrice: 4000 }],
    priceRange: { min: 4000, max: 7000 },
    shortDescription: 'Papier peint haut de gamme, non autocollant, pour un rendu durable.',
    features: ['10 m × 53 cm (5,3 m²)', 'Pose à la colle', 'Lessivable'],
    families: [
      {
        slug: 'floral',
        title: 'Floral',
        patterns: [
          { code: 'IN-F01', name: 'Jardin anglais', style: floral('#eef0e6', '#7a8f5a'), priceOverride: 7000 },
          { code: 'IN-F02', name: 'Feuillage doré', style: floral('#2c2a26', '#c69c6d'), priceOverride: 6000 },
        ],
      },
      {
        slug: 'uni-texture',
        title: 'Uni & texturé',
        patterns: [
          { code: 'IN-U01', name: 'Lin naturel', style: plain('#cfc4b2'), priceOverride: 4000 },
          { code: 'IN-U02', name: 'Béton ciré', style: plain('#9c9a95'), priceOverride: 5000 },
          { code: 'IN-U03', name: 'Taupe', style: plain('#8a7a6b'), priceOverride: 4500, availability: 'sur_commande' },
        ],
      },
    ],
  },
  {
    slug: 'feuille-marbree',
    title: 'Feuille marbrée',
    category: 'revetement-mural',
    unit: 'feuille',
    dimensions: '1,22 m × 2,44 m',
    coveragePerUnit: 2.97,
    priceTiers: [{ minQty: 1, unitPrice: 15000 }],
    shortDescription: 'Grandes feuilles effet marbre brillant, pour une salle de bain ou un mur d’accent.',
    features: ['1,22 m × 2,44 m', 'Effet marbre brillant', 'Imperméable'],
    isFeatured: true,
    families: [
      {
        slug: 'marbre',
        title: 'Marbre',
        patterns: [
          { code: 'FM-01', name: 'Calacatta blanc', style: marble('#fbfaf7', '#b89a6a') },
          { code: 'FM-02', name: 'Noir Marquina', style: marble('#151414', '#e8e6e1') },
          { code: 'FM-03', name: 'Beige crème', style: marble('#e8dccb', '#b08d5f') },
          { code: 'FM-04', name: 'Gris perle', style: marble('#a3a3a1', '#f0f0f0') },
        ],
      },
    ],
  },
  {
    slug: 'panneau-3d',
    title: 'Panneau 3D',
    category: 'revetement-mural',
    unit: 'piece',
    dimensions: '50 × 50 cm',
    coveragePerUnit: 0.25,
    priceTiers: [
      { minQty: 1, unitPrice: 1500 },
      { minQty: 20, unitPrice: 1200 },
    ],
    shortDescription: 'Panneaux en relief pour un mur qui accroche la lumière.',
    features: ['50 × 50 cm', 'Relief 3D', 'Peut se peindre'],
    families: [
      {
        slug: 'relief',
        title: 'Relief',
        patterns: [
          { code: 'P3D-01', name: 'Losanges', style: tiles('#f4f2ee', '#d8d3ca') },
          { code: 'P3D-02', name: 'Briques blanches', style: brick('#f6f4f0', '#dcd7cf') },
          { code: 'P3D-03', name: 'Vagues', style: geo('#f4f2ee', '#cfc8bc') },
        ],
      },
    ],
  },
  {
    slug: 'tasseaux-bois',
    title: 'Tasseaux de bois',
    category: 'revetement-mural',
    unit: 'piece',
    dimensions: '2,70 m',
    priceTiers: [{ minQty: 1, unitPrice: 3500 }],
    shortDescription: 'Tasseaux décoratifs pour un mur effet lattes tendance.',
    features: ['2,70 m de long', 'Effet bois naturel', 'Pose facile'],
    card: { bg: '#40200c', fg: '#c69c6d', backdrop: planks('#b8875a', '#3a2414') },
  },

  // --- Revêtement de sol -----------------------------------------------------
  {
    slug: 'revetement-pvc',
    title: 'Revêtement de sol PVC',
    category: 'revetement-sol',
    unit: 'm2',
    coveragePerUnit: 1,
    priceTiers: [{ minQty: 1, unitPrice: 3000 }],
    shortDescription: 'Sol en rouleau, facile à poser sur un carrelage existant.',
    features: ['Rouleau de 2 m de large', 'Imperméable', 'Antidérapant'],
    isFeatured: true,
    families: [
      {
        slug: 'effet-bois',
        title: 'Effet bois',
        patterns: [
          { code: 'SOL-B01', name: 'Chêne doré', style: wood('#a0703f', '#4a2f17') },
          { code: 'SOL-B02', name: 'Noyer', style: wood('#6b4426', '#2a180b') },
          { code: 'SOL-B03', name: 'Gris cendré', style: wood('#8c8781', '#3d3a37') },
        ],
      },
      {
        slug: 'carreaux',
        title: 'Effet carreaux',
        patterns: [
          { code: 'SOL-C01', name: 'Carreaux de ciment bleus', style: tiles('#ece4d6', '#2f4a5a') },
          { code: 'SOL-C02', name: 'Carreaux noir & blanc', style: tiles('#f2f0ec', '#1a1a1a') },
        ],
      },
    ],
  },
  {
    slug: 'faux-carreaux-autocollants',
    title: 'Faux carreaux autocollants',
    category: 'revetement-sol',
    unit: 'piece',
    dimensions: '30 × 30 cm',
    coveragePerUnit: 0.09,
    priceTiers: [
      { minQty: 1, unitPrice: 500 },
      { minQty: 20, unitPrice: 400 },
    ],
    shortDescription: 'Carreaux adhésifs pour sol et crédence, sans joint ni colle.',
    features: ['30 × 30 cm', 'Autocollant', 'Imperméable'],
    families: [
      {
        slug: 'carreaux',
        title: 'Carreaux de ciment',
        patterns: [
          { code: 'FC-01', name: 'Terracotta', style: tiles('#f1e6d8', '#b4563a') },
          { code: 'FC-02', name: 'Vert sauge', style: tiles('#eef0e8', '#6b8068') },
        ],
      },
    ],
  },
  {
    slug: 'plancher-a-clic',
    title: 'Plancher à clic',
    category: 'revetement-sol',
    unit: 'paquet',
    dimensions: 'Paquet de 2,2 m²',
    coveragePerUnit: 2.2,
    priceTiers: [{ minQty: 1, unitPrice: 12500 }],
    shortDescription: 'Lames qui s’emboîtent sans colle : un vrai parquet en une journée.',
    features: ['2,2 m² par paquet', 'Pose à clic, sans colle'],
    card: { bg: '#faf6f0', fg: '#40200c', backdrop: wood('#b98a55', '#4a2f17') },
  },

  // --- Plafond ---------------------------------------------------------------
  {
    slug: 'faux-staff',
    title: 'Faux staff',
    category: 'plafond',
    unit: 'piece',
    dimensions: '50 × 50 cm',
    coveragePerUnit: 0.25,
    priceTiers: [{ minQty: 1, unitPrice: 1000 }],
    shortDescription: 'Dalles de plafond décoratives, légères et faciles à coller.',
    features: ['50 × 50 cm', 'Léger', 'Peut se peindre'],
    isFeatured: true,
    card: { bg: '#faf6f0', fg: '#40200c', backdrop: plain('#f2efe9') },
  },

  // --- Déco & finitions -----------------------------------------------------
  {
    slug: 'spray-peinture-or',
    title: 'Spray peinture or',
    category: 'deco',
    unit: 'bombe',
    dimensions: '400 ml',
    priceTiers: [{ minQty: 1, unitPrice: 1500 }],
    shortDescription: 'Pour redonner de l’éclat à un cadre, un pied de lampe ou un meuble.',
    features: ['400 ml', 'Séchage rapide', 'Effet métallisé'],
    card: { bg: '#40200c', fg: '#c69c6d' },
  },
  {
    slug: 'spray-peinture-noir-mat',
    title: 'Spray peinture noir mat',
    category: 'deco',
    unit: 'bombe',
    dimensions: '400 ml',
    priceTiers: [{ minQty: 1, unitPrice: 1500 }],
    shortDescription: 'Finition noire mate, moderne et couvrante.',
    features: ['400 ml', 'Séchage rapide', 'Finition mate'],
    card: { bg: '#1f140c', fg: '#e6cfae' },
  },
  {
    slug: 'ruban-decoratif-dore',
    title: 'Ruban décoratif doré',
    category: 'deco',
    unit: 'piece',
    dimensions: 'Rouleau de 5 m',
    priceTiers: [{ minQty: 1, unitPrice: 1000 }],
    shortDescription: 'Ruban adhésif doré pour souligner un miroir, une porte ou un meuble.',
    features: ['5 m', 'Autocollant', 'Effet miroir doré'],
    card: { bg: '#e6cfae', fg: '#40200c' },
    availability: 'sur_commande',
  },

  // --- Noël ------------------------------------------------------------------
  {
    slug: 'sapin-de-noel',
    title: 'Sapin de Noël',
    category: 'noel',
    unit: 'piece',
    dimensions: '1,80 m',
    priceTiers: [{ minQty: 1, unitPrice: 25000 }],
    shortDescription: 'Sapin artificiel fourni, pied inclus.',
    features: ['1,80 m', 'Pied inclus', 'Réutilisable'],
    isFeatured: true,
    card: { bg: '#1f3b36', fg: '#c69c6d' },
  },
  {
    slug: 'boules-de-noel',
    title: 'Boules de Noël',
    category: 'noel',
    unit: 'paquet',
    dimensions: 'Boîte de 12',
    priceTiers: [{ minQty: 1, unitPrice: 3000 }],
    shortDescription: 'Boules incassables dorées et rouges.',
    features: ['12 boules', 'Incassables'],
    card: { bg: '#7a1f1f', fg: '#e6cfae' },
  },
  {
    slug: 'fleurs-de-noel',
    title: 'Fleurs de Noël',
    category: 'noel',
    unit: 'piece',
    priceTiers: [{ minQty: 1, unitPrice: 1500 }],
    shortDescription: 'Poinsettias artificiels pour vos tables et entrées.',
    features: ['Fleur artificielle', 'Réutilisable'],
    card: { bg: '#faf6f0', fg: '#7a1f1f', backdrop: floral('#f6efe6', '#b3302a') },
  },
]
