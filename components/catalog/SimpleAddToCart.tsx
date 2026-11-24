'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart/cartStore'
import { CheckIcon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/Toaster'
import { QtyStepper } from '@/components/ui/QtyStepper'
import { formatPrice, unitLabel } from '@/lib/format'
import { getNextTier, getTierPrice } from '@/lib/pricing'
import type { Availability, PriceTier, Unit } from '@/lib/types'

interface Props {
  product: { id: string; title: string; unit: Unit; priceTiers: PriceTier[]; availability: Availability }
}

export function SimpleAddToCart({ product }: Props) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const add = useCart((s) => s.add)
  const showToast = useToast((s) => s.show)
  const inCart = useCart((s) => s.items.find((i) => i.productId === product.id && !i.patternCode)?.qty ?? 0)

  const totalAfter = inCart + qty
  const unitPrice = getTierPrice(product.priceTiers, totalAfter)
  const next = getNextTier(product.priceTiers, totalAfter)

  if (product.availability === 'epuise') {
    return (
      <p className="bg-status-out/15 p-3 text-sm text-ink-900">
        Épuisé pour le moment. Demandez-nous sur WhatsApp quand il revient.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={setQty} />
        <button
          type="button"
          onClick={() => {
            add({ productId: product.id, qty })
            showToast({ title: 'Ajouté au panier', detail: `${product.title} × ${qty}` })
            setAdded(true)
            setTimeout(() => setAdded(false), 1500)
          }}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 bg-brown-900 px-5 font-semibold text-gold-200 transition hover:bg-brown-700 sm:flex-none"
        >
          {added ? (
            <>
              <CheckIcon className="size-5" /> Ajouté au panier
            </>
          ) : (
            `Ajouter au panier · ${formatPrice(unitPrice * qty)}`
          )}
        </button>
      </div>
      {next && (
        <p className="text-sm font-medium text-status-ok">
          Plus que {next.qtyNeeded} {unitLabel(product.unit, next.qtyNeeded)} pour passer à {formatPrice(next.unitPrice)}{' '}
          l’unité
        </p>
      )}
      {inCart > 0 && <p className="text-sm text-brown-700">Déjà {inCart} dans votre panier.</p>}
    </div>
  )
}
