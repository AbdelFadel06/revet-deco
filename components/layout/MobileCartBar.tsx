'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartTotals } from '@/components/cart/useCartSummary'
import { formatPrice } from '@/lib/format'

/** Barre fixe en bas (mobile) : « 3 articles · 7 500 F · Voir le panier ». */
export function MobileCartBar() {
  const pathname = usePathname()
  const { count, totals } = useCartTotals()
  if (count === 0 || pathname === '/panier') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-400 bg-brown-900 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
      <Link href="/panier" className="flex min-h-11 items-center justify-between gap-3 text-cream-50">
        <span className="text-sm">
          <span className="font-semibold">
            {count} article{count > 1 ? 's' : ''}
          </span>
          {totals && <span className="text-cream-50/80"> · {formatPrice(totals.total)}</span>}
        </span>
        <span className="bg-gold-400 px-4 py-2 text-sm font-semibold text-brown-900">Voir le panier</span>
      </Link>
    </div>
  )
}
