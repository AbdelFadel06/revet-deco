'use server'

import type { SanityImageData } from '@/components/ui/SanityImage'
import { normalizeCode } from '@/lib/format'
import { getCartTotals, type CartTotals } from '@/lib/pricing'
import type { CartItem } from '@/lib/types'
import { getCartCatalog } from '@/sanity/lib/data'
import { toCatalog } from '@/sanity/lib/toCatalog'

const MAX_LINES = 100

/** Nettoie ce qui vient du navigateur (localStorage modifiable par l'utilisateur). */
function sanitize(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, MAX_LINES)
    .filter(
      (i): i is CartItem =>
        typeof i === 'object' &&
        i !== null &&
        typeof (i as CartItem).productId === 'string' &&
        (i as CartItem).productId.length < 200 &&
        Number.isInteger((i as CartItem).qty) &&
        (i as CartItem).qty > 0 &&
        (i as CartItem).qty <= 10_000 &&
        ((i as CartItem).patternCode == null || typeof (i as CartItem).patternCode === 'string'),
    )
    .map((i) => ({ productId: i.productId, patternCode: i.patternCode ?? null, qty: i.qty }))
}

/**
 * Recalcule le panier côté serveur avec les prix ACTUELS de Sanity.
 * Les prix ne viennent jamais du navigateur.
 */
export async function priceCart(input: unknown): Promise<CartTotals> {
  return (await getCartView(input)).totals
}

/** Infos d'affichage (images, liens) pour la page panier. */
export interface CartDisplay {
  products: Record<string, { href: string | null; image: SanityImageData | null; features?: string[] }>
  patterns: Record<string, { image: SanityImageData | null; href: string | null }>
}

const EMPTY: CartTotals = { groups: [], invalidItems: [], itemCount: 0, total: 0, savings: 0 }

/** Totaux recalculés + infos d'affichage de chaque ligne. */
export async function getCartView(input: unknown): Promise<{ totals: CartTotals; display: CartDisplay }> {
  const items = sanitize(input)
  if (items.length === 0) return { totals: EMPTY, display: { products: {}, patterns: {} } }
  const data = await getCartCatalog(
    items.map((i) => i.productId),
    items.flatMap((i) => (i.patternCode ? [i.patternCode] : [])),
  )

  const display: CartDisplay = { products: {}, patterns: {} }
  const productHref: Record<string, string | null> = {}
  for (const p of data.products) {
    const href = p.slug && p.categorySlug ? `/${p.categorySlug}/${p.slug}` : null
    productHref[p._id] = href
    display.products[p._id] = { href, image: p.mainImage }
  }
  for (const pat of data.patterns) {
    if (!pat.code) continue
    const base = pat.productId ? productHref[pat.productId] : null
    display.patterns[normalizeCode(pat.code)] = {
      image: pat.image,
      href: base ? `${base}/${encodeURIComponent(pat.code)}` : null,
    }
  }
  return { totals: getCartTotals(items, toCatalog(data)), display }
}
