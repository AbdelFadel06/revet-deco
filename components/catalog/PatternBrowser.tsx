'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@/components/cart/cartStore'
import { CheckIcon, CloseIcon } from '@/components/ui/icons'
import { QtyStepper } from '@/components/ui/QtyStepper'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'
import { useToast } from '@/components/ui/Toaster'
import { useUrlState } from '@/components/ui/useUrlState'
import { formatPrice, normalizeCode, unitLabel } from '@/lib/format'
import { getNextTier, getTierPrice } from '@/lib/pricing'
import type { Availability, PriceTier, Unit } from '@/lib/types'
import { AvailabilityBadge, FeatureChips } from './badges'

export interface BrowserPattern {
  _id: string
  code: string
  name: string
  availability: Availability
  priceOverride: number | null
  familySlug: string | null
  image: SanityImageData | null
}

interface Props {
  product: { id: string; title: string; unit: Unit; priceTiers: PriceTier[]; features: string[] }
  families: { slug: string; title: string; count: number }[]
  patterns: BrowserPattern[]
}

const PAGE_SIZE = 40
const ALL = 'tous'

/**
 * Grille de tous les motifs d'un produit, filtrable par famille.
 * Le filtre est reflété dans l'URL (?famille=marbre) pour le partage,
 * sans être lu côté serveur (la page reste statique).
 */
export function PatternBrowser({ product, families, patterns }: Props) {
  // Famille filtrée et motif ouvert vivent dans l'URL : ?famille=marbre#PP-M01
  // → liens partageables, et le bouton « retour » ferme la fenêtre.
  const { search, hash, update } = useUrlState()
  const requested = search.get('famille')
  const family = requested && families.some((f) => f.slug === requested) ? requested : ALL
  const selected = hash ? (patterns.find((p) => p.code === normalizeCode(hash)) ?? null) : null

  // Pagination : remise à zéro quand on change de famille.
  const [paging, setPaging] = useState({ family: ALL, visible: PAGE_SIZE })
  const visible = paging.family === family ? paging.visible : PAGE_SIZE
  const setVisible = (fn: (v: number) => number) => setPaging({ family, visible: fn(visible) })

  const setSelected = (p: BrowserPattern | null) => update({ hash: p?.code ?? null })
  const chooseFamily = (slug: string) => update({ params: { famille: slug === ALL ? null : slug } })

  const filtered = useMemo(
    () => (family === ALL ? patterns : patterns.filter((p) => p.familySlug === family)),
    [family, patterns],
  )
  const basePrice = getTierPrice(product.priceTiers, 1)

  return (
    <section aria-labelledby="motifs-title" className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="motifs-title" className="font-serif text-2xl text-brown-900">
          Choisissez votre motif
        </h2>
        <p className="text-sm text-brown-700">
          {filtered.length} motif{filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {families.length > 1 && (
        <div className="-mx-4 mt-4 overflow-x-auto px-4 scrollbar-none">
          <ul className="flex gap-2" role="tablist" aria-label="Familles de motifs">
            {[{ slug: ALL, title: 'Tous', count: patterns.length }, ...families].map((f) => {
              const active = f.slug === family
              return (
                <li key={f.slug} className="shrink-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => chooseFamily(f.slug)}
                    className={`min-h-11 border px-4 text-sm transition ${
                      active
                        ? 'border-brown-900 bg-brown-900 text-gold-200'
                        : 'border-gold-200 bg-white text-brown-900 hover:border-gold-400'
                    }`}
                  >
                    {f.title} <span className={active ? 'text-gold-400' : 'text-brown-700/70'}>{f.count}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {filtered.slice(0, visible).map((p) => {
          const out = p.availability === 'epuise'
          return (
            <li key={p._id} id={p.code}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="group flex w-full flex-col overflow-hidden border border-gold-200 bg-white text-left transition hover:border-gold-400 focus-visible:outline-2 focus-visible:outline-brown-900"
              >
                <div className="relative">
                  <SanityImage
                    image={p.image}
                    alt={`Motif ${p.code} – ${p.name}`}
                    aspect={1}
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
                    className={`aspect-square w-full object-cover ${out ? 'opacity-50 grayscale' : ''}`}
                  />
                  <AvailabilityBadge availability={p.availability} className="absolute left-2 top-2" />
                </div>
                <div className="p-2.5">
                  <p className="pattern-code text-base text-brown-900">{p.code}</p>
                  <p className="truncate text-sm text-brown-700">{p.name}</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{formatPrice(p.priceOverride ?? basePrice)}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {visible < filtered.length && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="min-h-11 border border-brown-900 px-6 text-sm font-medium text-brown-900 hover:bg-brown-900 hover:text-gold-200"
          >
            Voir plus de motifs ({filtered.length - visible})
          </button>
        </div>
      )}

      {/* Monté seulement quand un motif est choisi : quantité remise à 1 à chaque ouverture. */}
      {selected && (
        <PatternSheet key={selected.code} product={product} pattern={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

function PatternSheet({
  product,
  pattern,
  onClose,
}: {
  product: Props['product']
  pattern: BrowserPattern
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const add = useCart((s) => s.add)
  const items = useCart((s) => s.items)
  const showToast = useToast((s) => s.show)

  // Ouverture en modale (piège le focus, Échap ferme) dès le montage.
  useEffect(() => {
    const d = dialogRef.current
    if (d && !d.open) d.showModal()
  }, [])

  // Quantité totale du produit déjà au panier (le palier se calcule dessus).
  const inCartForProduct = items.filter((i) => i.productId === product.id).reduce((s, i) => s + i.qty, 0)
  const inCartForPattern = items.find((i) => i.productId === product.id && i.patternCode === pattern.code)?.qty ?? 0

  const out = pattern.availability === 'epuise'
  const override = pattern.priceOverride
  const totalAfter = inCartForProduct + qty
  const unitPrice = override ?? getTierPrice(product.priceTiers, totalAfter)
  const next = override != null ? null : getNextTier(product.priceTiers, totalAfter)
  const hasOverride = override != null

  const handleAdd = () => {
    if (out) return
    add({ productId: product.id, patternCode: pattern.code, qty })
    showToast({ title: 'Ajouté au panier', detail: `${pattern.code} · ${pattern.name} × ${qty}` })
    setAdded(true)
    setTimeout(onClose, 900)
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="sheet-title"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto bg-cream-50 p-0 backdrop:bg-ink-900/60 sm:m-auto sm:max-w-3xl"
    >
      {pattern && (
        <div className="grid sm:grid-cols-2">
          <div className="relative">
            <SanityImage
              image={pattern.image}
              alt={`Motif ${pattern.code} – ${pattern.name}`}
              aspect={1}
              sizes="(min-width: 640px) 384px, 100vw"
              className={`aspect-square w-full object-cover ${out ? 'opacity-50 grayscale' : ''}`}
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex size-11 items-center justify-center bg-cream-50/90 text-brown-900"
              aria-label="Fermer"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div>
              <p className="text-sm text-brown-700">{product.title}</p>
              <h2 id="sheet-title" className="pattern-code mt-1 text-3xl text-brown-900">
                {pattern.code}
              </h2>
              <p className="text-lg text-ink-900">{pattern.name}</p>
              <AvailabilityBadge availability={pattern.availability} className="mt-2" />
            </div>

            <FeatureChips features={product.features} />

            <div>
              <p className="text-2xl font-semibold text-ink-900">
                {formatPrice(unitPrice)}{' '}
                <span className="text-base font-normal text-brown-700">/ {unitLabel(product.unit, 1)}</span>
              </p>
              {next && (
                <p className="mt-1 text-sm font-medium text-status-ok">
                  Plus que {next.qtyNeeded} {unitLabel(product.unit, next.qtyNeeded)} pour passer à{' '}
                  {formatPrice(next.unitPrice)} l’unité
                </p>
              )}
              {inCartForProduct > 0 && !hasOverride && (
                <p className="mt-1 text-xs text-brown-700">
                  Prix calculé avec les {inCartForProduct} {unitLabel(product.unit, inCartForProduct)} déjà au panier
                  (tous motifs confondus).
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

            {inCartForPattern > 0 && !added && (
              <p className="text-sm text-brown-700">Déjà {inCartForPattern} dans votre panier.</p>
            )}
            <p className="text-xs text-brown-700">Disponibilité confirmée sur WhatsApp.</p>
          </div>
        </div>
      )}
    </dialog>
  )
}
