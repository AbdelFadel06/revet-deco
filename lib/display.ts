import { formatPrice, unitLabel } from './format'
import type { PriceTier, Unit } from './types'

const PER_UNIT: Record<Unit, string> = {
  rouleau: 'le rouleau',
  m2: 'le m²',
  paquet: 'le paquet',
  piece: 'la pièce',
  feuille: 'la feuille',
  bombe: 'la bombe',
  metre: 'le mètre',
}

export interface PriceLabel {
  /** « 2 500 F » ou « 4 000 – 7 000 F » */
  main: string
  /** « le rouleau » */
  per: string
  /** « 2 000 F dès 6 rouleaux », pour le meilleur palier */
  tierHint: string | null
}

export function getPriceLabel(product: {
  unit: Unit
  priceTiers: PriceTier[]
  priceRange?: { min?: number | null; max?: number | null } | null
}): PriceLabel {
  const tiers = [...product.priceTiers].sort((a, b) => a.minQty - b.minQty)
  const per = PER_UNIT[product.unit]
  const { min, max } = product.priceRange ?? {}

  let main: string
  if (min != null && max != null && min !== max) {
    main = `${new Intl.NumberFormat('fr-FR').format(min)} – ${formatPrice(max)}`
  } else if (tiers.length > 0) {
    main = formatPrice(tiers[0].unitPrice)
  } else {
    main = 'Prix sur demande'
  }

  const best = tiers.length > 1 ? tiers[tiers.length - 1] : null
  const tierHint = best ? `${formatPrice(best.unitPrice)} dès ${best.minQty} ${unitLabel(product.unit, best.minQty)}` : null

  return { main, per: tiers.length || min != null ? per : '', tierHint }
}

/** Coupe une liste à un nombre pair d'éléments (rangées complètes sur 2 colonnes mobiles). */
export function evenSlice<T>(list: T[]): T[] {
  return list.length % 2 === 0 ? list : list.slice(0, -1)
}
