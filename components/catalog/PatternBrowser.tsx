'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'
import { useUrlState } from '@/components/ui/useUrlState'
import { formatPrice } from '@/lib/format'
import { getTierPrice } from '@/lib/pricing'
import type { Availability } from '@/lib/types'
import { AvailabilityBadge } from './badges'
import { PatternGallery, type GalleryPhoto } from './pattern/PatternGallery'
import { PatternPurchase, type PurchaseProduct } from './pattern/PatternPurchase'
import { patternHref, usePatternRoute } from './pattern/usePatternRoute'

export interface BrowserPattern {
  _id: string
  code: string
  name: string
  availability: Availability
  priceOverride: number | null
  familySlug: string | null
  image: SanityImageData | null
  photos: GalleryPhoto[]
}

interface Props {
  product: PurchaseProduct & { slug: string; categorySlug: string }
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
  // Famille filtrée dans l'URL (?famille=marbre) ; motif ouvert = adresse de sa page.
  const { search, update } = useUrlState()
  const requested = search.get('famille')
  const family = requested && families.some((f) => f.slug === requested) ? requested : ALL

  const hrefOf = useCallback(
    (code: string) => patternHref(product.categorySlug, product.slug, code),
    [product.categorySlug, product.slug],
  )
  const codes = useMemo(() => patterns.map((p) => p.code), [patterns])
  const { selectedCode, open, close } = usePatternRoute(codes, hrefOf, `/${product.categorySlug}/${product.slug}`)
  const selected = selectedCode ? (patterns.find((p) => p.code === selectedCode) ?? null) : null

  // Pagination : remise à zéro quand on change de famille.
  const [paging, setPaging] = useState({ family: ALL, visible: PAGE_SIZE })
  const visible = paging.family === family ? paging.visible : PAGE_SIZE
  const setVisible = (fn: (v: number) => number) => setPaging({ family, visible: fn(visible) })

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
              <a
                href={hrefOf(p.code)}
                onClick={(e) => {
                  e.preventDefault()
                  open(p.code)
                }}
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
              </a>
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
        <PatternSheet key={selected.code} product={product} pattern={selected} href={hrefOf(selected.code)} onClose={close} />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

/**
 * Fenêtre du motif par-dessus la grille (carte posée en bas sur mobile).
 * Contenu partagé avec la page dédiée : galerie + bloc d'achat.
 */
export function PatternSheet({
  product,
  pattern,
  href,
  onClose,
}: {
  product: PurchaseProduct
  pattern: BrowserPattern
  href: string
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Ouverture en modale (piège le focus, Échap ferme) dès le montage.
  useEffect(() => {
    const d = dialogRef.current
    if (d && !d.open) d.showModal()
  }, [])

  const photos: GalleryPhoto[] =
    pattern.photos.length > 0
      ? pattern.photos
      : pattern.image
        ? [{ ...pattern.image, _key: 'principale', caption: null, isRender: false }]
        : []

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="sheet-title"
      // Mobile : carte posée en bas avec 12 px de marge sur les côtés et en bas.
      className="mx-auto mb-[max(0.75rem,env(safe-area-inset-bottom))] mt-auto max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-none overflow-y-auto bg-cream-50 p-0 shadow-2xl backdrop:bg-ink-900/60 sm:m-auto sm:w-full sm:max-w-3xl"
    >
      <div className="grid sm:grid-cols-2">
        <div className="relative">
          <PatternGallery
            photos={photos}
            alt={`Motif ${pattern.code} – ${pattern.name}`}
            dimmed={pattern.availability === 'epuise'}
            sizes="(min-width: 640px) 384px, 100vw"
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
        <div className="p-5">
          <PatternPurchase product={product} pattern={pattern} shareUrl={href} headingId="sheet-title" onAdded={onClose} />
        </div>
      </div>
    </dialog>
  )
}
