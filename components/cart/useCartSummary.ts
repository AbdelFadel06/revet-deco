'use client'

import { useEffect, useState } from 'react'
import { priceCart } from '@/app/actions/cart'
import type { CartTotals } from '@/lib/pricing'
import type { CartItem } from '@/lib/types'
import { useCart } from './cartStore'

/**
 * Totaux du panier recalculés par le serveur à chaque changement.
 * `pending` est vrai pendant le calcul : on garde alors l'ancien total affiché.
 */
export function useCartTotals() {
  const items = useCart((s) => s.items)
  // Résultat associé au panier pour lequel il a été calculé.
  const [result, setResult] = useState<{ for: CartItem[]; totals: CartTotals | null } | null>(null)

  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    priceCart(items)
      .then((totals) => !cancelled && setResult({ for: items, totals }))
      .catch(() => !cancelled && setResult({ for: items, totals: null }))
    return () => {
      cancelled = true
    }
  }, [items])

  const empty = items.length === 0
  return {
    items,
    /** Nombre d'unités, connu immédiatement (sans attendre le serveur). */
    count: items.reduce((s, i) => s + i.qty, 0),
    totals: empty ? null : (result?.totals ?? null),
    pending: !empty && result?.for !== items,
  }
}
