import { normalizeCode } from '@/lib/format'
import { AVAILABILITIES, UNITS, type Availability, type Catalog, type Unit } from '@/lib/types'
import type { CART_CATALOG_QUERY_RESULT } from '../types'

const asUnit = (u: string | null): Unit => (UNITS as readonly string[]).includes(u ?? '') ? (u as Unit) : 'piece'
const asAvailability = (a: string | null): Availability =>
  (AVAILABILITIES as readonly string[]).includes(a ?? '') ? (a as Availability) : 'disponible'

/** Convertit le résultat GROQ en données pures pour `lib/pricing.ts`. */
export function toCatalog(data: CART_CATALOG_QUERY_RESULT): Catalog {
  const catalog: Catalog = { products: {}, patterns: {} }
  for (const p of data.products) {
    catalog.products[p._id] = {
      id: p._id,
      title: p.title ?? 'Produit',
      unit: asUnit(p.unit),
      priceTiers: (p.priceTiers ?? [])
        .flatMap((t) => (t.minQty != null && t.unitPrice != null ? [{ minQty: t.minQty, unitPrice: t.unitPrice }] : []))
        .sort((a, b) => a.minQty - b.minQty),
      hasPatterns: p.hasPatterns,
      availability: asAvailability(p.availability),
    }
  }
  for (const pat of data.patterns) {
    if (!pat.code || !pat.productId) continue
    const code = normalizeCode(pat.code)
    catalog.patterns[code] = {
      code,
      name: pat.name ?? '',
      productId: pat.productId,
      availability: asAvailability(pat.availability),
      priceOverride: pat.priceOverride,
    }
  }
  return catalog
}
