'use client'

import { useState } from 'react'
import { useCart } from '@/components/cart/cartStore'
import { CheckIcon } from '@/components/ui/icons'
import { QtyStepper } from '@/components/ui/QtyStepper'
import { useToast } from '@/components/ui/Toaster'
import { formatPrice, unitLabel } from '@/lib/format'
import { getNextTier, getTierPrice } from '@/lib/pricing'
import type { Availability, PriceTier, Unit } from '@/lib/types'
import { AvailabilityBadge, FeatureChips } from '../badges'

export interface PurchaseProduct {
  id: string
  title: string
  unit: Unit
  priceTiers: PriceTier[]
  features: string[]
}

export interface PurchasePattern {
  code: string
  name: string
  availability: Availability
  priceOverride: number | null
}

/**
 * Code, caractéristiques, prix (palier calculé avec le panier), quantité,
 * « Ajouter » et partage. Partagé entre la fenêtre et la page du motif.
 */
export function PatternPurchase({
  product,
  pattern,
  shareUrl,
  headingId,
  headingLevel = 'h2',
  onAdded,
}: {
  product: PurchaseProduct
  pattern: PurchasePattern
  /** Adresse de la page du motif, pour le bouton « Partager ». */
  shareUrl: string
  headingId?: string
  headingLevel?: 'h1' | 'h2'
  onAdded?: () => void
}) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [copied, setCopied] = useState(false)
  const add = useCart((s) => s.add)
  const items = useCart((s) => s.items)
  const showToast = useToast((s) => s.show)

  // Quantité totale du produit déjà au panier (le palier se calcule dessus).
  const inCartForProduct = items.filter((i) => i.productId === product.id).reduce((s, i) => s + i.qty, 0)
  const inCartForPattern = items.find((i) => i.productId === product.id && i.patternCode === pattern.code)?.qty ?? 0

  const out = pattern.availability === 'epuise'
  const override = pattern.priceOverride
  const totalAfter = inCartForProduct + qty
  const unitPrice = override ?? getTierPrice(product.priceTiers, totalAfter)
  const next = override != null ? null : getNextTier(product.priceTiers, totalAfter)

  const handleAdd = () => {
    if (out) return
    add({ productId: product.id, patternCode: pattern.code, qty })
    showToast({ title: 'Ajouté au panier', detail: `${pattern.code} · ${pattern.name} × ${qty}` })
    setAdded(true)
    if (onAdded) window.setTimeout(onAdded, 900)
    else window.setTimeout(() => setAdded(false), 1500)
  }

  const share = async () => {
    const url = new URL(shareUrl, window.location.origin).toString()
    const title = `${pattern.code} – ${pattern.name}`
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} · ${product.title}`, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }

  const Heading = headingLevel

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-brown-700">{product.title}</p>
        <Heading id={headingId} className="pattern-code mt-1 text-3xl text-brown-900">
          {pattern.code}
        </Heading>
        <p className="text-lg text-ink-900">{pattern.name}</p>
        <AvailabilityBadge availability={pattern.availability} className="mt-2" />
      </div>

      <FeatureChips features={product.features} />

      <div>
        <p className="text-2xl font-semibold text-ink-900">
          {formatPrice(unitPrice)} <span className="text-base font-normal text-brown-700">/ {unitLabel(product.unit, 1)}</span>
        </p>
        {next && (
          <p className="mt-1 text-sm font-medium text-status-ok">
            Plus que {next.qtyNeeded} {unitLabel(product.unit, next.qtyNeeded)} pour passer à {formatPrice(next.unitPrice)}{' '}
            l’unité
          </p>
        )}
        {inCartForProduct > 0 && override == null && (
          <p className="mt-1 text-xs text-brown-700">
            Prix calculé avec les {inCartForProduct} {unitLabel(product.unit, inCartForProduct)} déjà au panier (tous motifs
            confondus).
          </p>
        )}
      </div>

      {out ? (
        <p className="bg-status-out/15 p-3 text-sm text-ink-900">
          Ce motif est épuisé pour le moment. Demandez-nous sur WhatsApp quand il revient.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <QtyStepper value={qty} onChange={setQty} />
          <button
            type="button"
            onClick={handleAdd}
            disabled={added}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 bg-brown-900 px-5 font-semibold text-gold-200 transition hover:bg-brown-700 disabled:bg-status-ok disabled:text-white"
          >
            {added ? (
              <>
                <CheckIcon className="size-5" /> Ajouté au panier
              </>
            ) : (
              `Ajouter · ${formatPrice(unitPrice * qty)}`
            )}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        {inCartForPattern > 0 && !added ? (
          <p className="text-brown-700">Déjà {inCartForPattern} dans votre panier.</p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={share}
          className="min-h-11 font-medium text-brown-900 underline-offset-4 hover:underline"
        >
          {copied ? 'Lien copié ✓' : 'Partager ce motif'}
        </button>
      </div>
    </div>
  )
}
