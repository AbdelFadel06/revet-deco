/**
 * Types métier indépendants de Sanity.
 * Les données issues de GROQ sont converties vers ces types avant d'être
 * passées à la logique pure (pricing, whatsapp…).
 */

export const AVAILABILITIES = ['disponible', 'sur_commande', 'epuise'] as const
export type Availability = (typeof AVAILABILITIES)[number]

export const UNITS = ['rouleau', 'm2', 'paquet', 'piece', 'feuille', 'bombe', 'metre'] as const
export type Unit = (typeof UNITS)[number]

export interface PriceTier {
  /** Quantité minimale (totale, tous motifs confondus) pour ce palier. */
  minQty: number
  /** Prix unitaire en FCFA. */
  unitPrice: number
}

export interface PricingProduct {
  id: string
  title: string
  unit: Unit
  /** Triés par minQty croissant, le premier a minQty = 1. */
  priceTiers: PriceTier[]
  hasPatterns: boolean
  /** Utilisé quand hasPatterns = false. */
  availability?: Availability
}

export interface PricingPattern {
  code: string
  name: string
  productId: string
  availability: Availability
  /** Prix unitaire spécifique au motif (ex. papier peint intissé). */
  priceOverride?: number | null
}

/** Ce qui est stocké dans le panier (localStorage). Jamais de prix ici. */
export interface CartItem {
  productId: string
  patternCode?: string | null
  qty: number
}

/** Données actuelles du catalogue nécessaires pour recalculer le panier. */
export interface Catalog {
  products: Record<string, PricingProduct>
  /** Indexé par code motif (en majuscules). */
  patterns: Record<string, PricingPattern>
}

export interface SiteSettingsForOrder {
  shopName: string
  whatsappNumber: string
}
