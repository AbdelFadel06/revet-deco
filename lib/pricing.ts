import { normalizeCode } from './format'
import type {
  Availability,
  CartItem,
  Catalog,
  PriceTier,
  PricingPattern,
  PricingProduct,
} from './types'

/**
 * Prix unitaire d'après les paliers, pour une quantité donnée.
 * Les paliers sont supposés triés ; on les re-trie par sécurité.
 */
export function getTierPrice(tiers: PriceTier[], qty: number): number {
  if (tiers.length === 0) return 0
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty)
  let price = sorted[0].unitPrice
  for (const tier of sorted) {
    if (qty >= tier.minQty) price = tier.unitPrice
  }
  return price
}

/**
 * Prix unitaire appliqué à une ligne du panier.
 *
 * @param totalQty quantité servant à choisir le palier (voir `getTierQty`).
 * @param pattern  si le motif a un `priceOverride`, il remplace les paliers.
 */
export function getUnitPrice(
  product: Pick<PricingProduct, 'priceTiers'>,
  totalQty: number,
  pattern?: Pick<PricingPattern, 'priceOverride'> | null,
): number {
  if (pattern?.priceOverride != null) return pattern.priceOverride
  return getTierPrice(product.priceTiers, totalQty)
}

/**
 * RÈGLE MÉTIER (à confirmer avec le client) : le palier se calcule sur la
 * quantité TOTALE du produit dans le panier, tous motifs confondus.
 * Pour passer à un calcul par motif, il suffit de changer cette fonction.
 */
export function getTierQty(productLines: { qty: number }[], line: { qty: number }): number {
  void line // utilisé si la règle devient « par motif »
  return productLines.reduce((sum, l) => sum + l.qty, 0)
}

/** Prochain palier atteignable, pour l'incitation « Plus que 2 rouleaux… ». */
export function getNextTier(
  tiers: PriceTier[],
  qty: number,
): { qtyNeeded: number; unitPrice: number } | null {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty)
  const next = sorted.find((t) => t.minQty > qty)
  return next ? { qtyNeeded: next.minQty - qty, unitPrice: next.unitPrice } : null
}

// ---------------------------------------------------------------------------

export interface CartLineDetail {
  productId: string
  patternCode: string | null
  patternName: string | null
  availability: Availability
  qty: number
  unitPrice: number
  /** Prix unitaire sans remise de palier (premier palier). */
  baseUnitPrice: number
  lineTotal: number
}

export interface CartProductGroup {
  product: PricingProduct
  lines: CartLineDetail[]
  totalQty: number
  subtotal: number
  savings: number
  /** null si tous les motifs ont un prix spécifique ou si le dernier palier est atteint. */
  nextTier: { qtyNeeded: number; unitPrice: number } | null
}

export interface CartTotals {
  groups: CartProductGroup[]
  /** Lignes ignorées : produit/motif introuvable ou motif épuisé. */
  invalidItems: { item: CartItem; reason: 'introuvable' | 'epuise' }[]
  itemCount: number
  total: number
  savings: number
}

/**
 * Recalcule entièrement le panier à partir des données actuelles du catalogue.
 * Les prix ne sont jamais lus depuis le localStorage.
 */
export function getCartTotals(cart: CartItem[], catalog: Catalog): CartTotals {
  const invalidItems: CartTotals['invalidItems'] = []
  const byProduct = new Map<string, { item: CartItem; pattern: PricingPattern | null }[]>()

  for (const item of cart) {
    if (item.qty <= 0) continue
    const product = catalog.products[item.productId]
    const code = item.patternCode ? normalizeCode(item.patternCode) : null
    const pattern = code ? (catalog.patterns[code] ?? null) : null

    if (!product || (code && (!pattern || pattern.productId !== product.id))) {
      invalidItems.push({ item, reason: 'introuvable' })
      continue
    }
    const availability = pattern?.availability ?? product.availability ?? 'disponible'
    if (availability === 'epuise') {
      invalidItems.push({ item, reason: 'epuise' })
      continue
    }
    const list = byProduct.get(product.id) ?? []
    list.push({ item, pattern })
    byProduct.set(product.id, list)
  }

  const groups: CartProductGroup[] = []
  for (const [productId, entries] of byProduct) {
    const product = catalog.products[productId]
    // Les motifs à prix spécifique ne comptent pas pour les paliers.
    const tierLines = entries
      .filter((e) => e.pattern?.priceOverride == null)
      .map((e) => ({ qty: e.item.qty }))
    const baseUnitPrice = getTierPrice(product.priceTiers, 1)

    const lines: CartLineDetail[] = entries.map(({ item, pattern }) => {
      const tierQty = getTierQty(tierLines, { qty: item.qty })
      const unitPrice = getUnitPrice(product, tierQty, pattern)
      const base = pattern?.priceOverride ?? baseUnitPrice
      return {
        productId,
        patternCode: pattern?.code ?? null,
        patternName: pattern?.name ?? null,
        availability: pattern?.availability ?? product.availability ?? 'disponible',
        qty: item.qty,
        unitPrice,
        baseUnitPrice: base,
        lineTotal: unitPrice * item.qty,
      }
    })

    const totalQty = lines.reduce((s, l) => s + l.qty, 0)
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
    const savings = lines.reduce((s, l) => s + (l.baseUnitPrice - l.unitPrice) * l.qty, 0)
    const tierQty = tierLines.reduce((s, l) => s + l.qty, 0)

    groups.push({
      product,
      lines,
      totalQty,
      subtotal,
      savings,
      nextTier: tierLines.length === 0 ? null : getNextTier(product.priceTiers, tierQty),
    })
  }

  return {
    groups,
    invalidItems,
    itemCount: groups.reduce((s, g) => s + g.totalQty, 0),
    total: groups.reduce((s, g) => s + g.subtotal, 0),
    savings: groups.reduce((s, g) => s + g.savings, 0),
  }
}
