'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'
import { useUrlState } from '@/components/ui/useUrlState'
import { getPriceLabel } from '@/lib/display'
import { formatPrice } from '@/lib/format'
import { getTierPrice } from '@/lib/pricing'
import type { PriceTier, Unit } from '@/lib/types'
import { AvailabilityBadge, FeatureChips } from './badges'
import { PatternSheet, type BrowserPattern } from './PatternBrowser'
import { usePatternRoute } from './pattern/usePatternRoute'

export interface CategoryProduct {
  id: string
  slug: string
  href: string
  title: string
  unit: Unit
  priceTiers: PriceTier[]
  priceRange: { min?: number | null; max?: number | null } | null
  features: string[]
  hasPatterns: boolean
  image: SanityImageData | null
  patterns: (BrowserPattern & { familyTitle: string | null })[]
}

type Item =
  | { kind: 'pattern'; key: string; product: CategoryProduct; pattern: CategoryProduct['patterns'][number] }
  | { kind: 'product'; key: string; product: CategoryProduct }

const PAGE_SIZE = 24 // multiple de 2 (mobile), 3 (tablette) et 4 (ordinateur)
const ALL = 'tous'

/**
 * Tout le contenu d'une catégorie sur une seule page : chaque motif de chaque
 * produit, plus les produits sans motifs. Filtres par produit (puis par
 * famille), chargement progressif, et fenêtre du motif directement ici :
 * on peut ajouter au panier sans passer par la page produit.
 * État dans l'URL : ?produit=…&famille=…#CODE (liens partageables).
 */
export function CategoryBrowser({ products, categoryPath }: { products: CategoryProduct[]; categoryPath: string }) {
  const { search, update } = useUrlState()

  const requestedProduct = search.get('produit')
  const activeProduct = products.find((p) => p.slug === requestedProduct) ?? null

  const families = useMemo(() => {
    if (!activeProduct) return []
    const map = new Map<string, { slug: string; title: string; count: number }>()
    for (const p of activeProduct.patterns) {
      if (!p.familySlug) continue
      const f = map.get(p.familySlug) ?? { slug: p.familySlug, title: p.familyTitle ?? p.familySlug, count: 0 }
      f.count++
      map.set(p.familySlug, f)
    }
    return [...map.values()]
  }, [activeProduct])
  const requestedFamily = search.get('famille')
  const activeFamily = families.some((f) => f.slug === requestedFamily) ? requestedFamily : null

  const allItems = useMemo<Item[]>(
    () =>
      products.flatMap((product): Item[] =>
        product.hasPatterns && product.patterns.length > 0
          ? product.patterns.map((pattern) => ({ kind: 'pattern', key: pattern._id, product, pattern }))
          : [{ kind: 'product', key: product.id, product }],
      ),
    [products],
  )

  const items = allItems.filter(
    (it) =>
      (!activeProduct || it.product.id === activeProduct.id) &&
      (!activeFamily || (it.kind === 'pattern' && it.pattern.familySlug === activeFamily)),
  )

  // Chargement progressif, remis à zéro à chaque changement de filtre.
  const filterKey = `${activeProduct?.id ?? ALL}/${activeFamily ?? ALL}`
  const [paging, setPaging] = useState({ key: filterKey, visible: PAGE_SIZE })
  const visible = paging.key === filterKey ? paging.visible : PAGE_SIZE

  // Motif ouvert = adresse de sa page (/categorie/produit/CODE), cherché dans toute la catégorie.
  const productOfCode = useMemo(() => {
    const map = new Map<string, CategoryProduct>()
    for (const product of products) for (const p of product.patterns) map.set(p.code, product)
    return map
  }, [products])
  const codes = useMemo(() => [...productOfCode.keys()], [productOfCode])
  const hrefOf = useCallback(
    (code: string) => `${productOfCode.get(code)?.href ?? categoryPath}/${encodeURIComponent(code)}`,
    [productOfCode, categoryPath],
  )
  const { selectedCode, open, close } = usePatternRoute(codes, hrefOf, categoryPath)
  const selectedProduct = selectedCode ? productOfCode.get(selectedCode) : undefined
  const selected =
    selectedCode && selectedProduct
      ? { product: selectedProduct, pattern: selectedProduct.patterns.find((p) => p.code === selectedCode)! }
      : null

  const chooseProduct = (slug: string | null) => update({ params: { produit: slug, famille: null } })
  const chooseFamily = (slug: string | null) => update({ params: { famille: slug } })

  const countOf = (p: CategoryProduct) => (p.hasPatterns && p.patterns.length > 0 ? p.patterns.length : 1)

  return (
    <section aria-label="Produits et motifs">
      {/* Filtres : produits */}
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
        <ul className="flex gap-2 pb-1" aria-label="Filtrer par produit">
          <Chip active={!activeProduct} onClick={() => chooseProduct(null)} label="Tout voir" count={allItems.length} />
          {products.map((p) => (
            <Chip key={p.id} active={activeProduct?.id === p.id} onClick={() => chooseProduct(p.slug)} label={p.title} count={countOf(p)} />
          ))}
        </ul>
      </div>

      {/* Filtres : familles du produit choisi */}
      {families.length > 1 && (
        <div className="-mx-4 mt-2 overflow-x-auto px-4 scrollbar-none">
          <ul className="flex gap-2 pb-1" aria-label="Filtrer par famille">
            <Chip small active={!activeFamily} onClick={() => chooseFamily(null)} label="Toutes les familles" />
            {families.map((f) => (
              <Chip key={f.slug} small active={activeFamily === f.slug} onClick={() => chooseFamily(f.slug)} label={f.title} count={f.count} />
            ))}
          </ul>
        </div>
      )}

      {/* Rappel du produit choisi : prix, caractéristiques, fiche complète */}
      {activeProduct && <ProductSummary product={activeProduct} />}

      <p className="mt-5 text-sm text-brown-700" aria-live="polite">
        {items.length} {items.length > 1 ? 'résultats' : 'résultat'}
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {items.slice(0, visible).map((it) => (
          <li key={it.key} id={it.kind === 'pattern' ? it.pattern.code : undefined}>
            {it.kind === 'pattern' ? (
              <PatternTile item={it} showProduct={!activeProduct} href={hrefOf(it.pattern.code)} onOpen={() => open(it.pattern.code)} />
            ) : (
              <ProductTile product={it.product} />
            )}
          </li>
        ))}
      </ul>

      {visible < items.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setPaging({ key: filterKey, visible: visible + PAGE_SIZE })}
            className="inline-flex min-h-11 items-center border border-brown-900 px-6 text-sm font-semibold text-brown-900 transition hover:bg-brown-900 hover:text-gold-200"
          >
            Voir plus ({items.length - visible})
          </button>
        </div>
      )}

      {selected && (
        <PatternSheet
          key={selected.pattern.code}
          product={{
            id: selected.product.id,
            title: selected.product.title,
            unit: selected.product.unit,
            priceTiers: selected.product.priceTiers,
            features: selected.product.features,
          }}
          pattern={selected.pattern}
          href={hrefOf(selected.pattern.code)}
          onClose={close}
        />
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------

function Chip({
  label,
  count,
  active,
  onClick,
  small = false,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`flex items-center gap-1.5 border px-4 text-sm transition ${small ? 'min-h-10' : 'min-h-11'} ${
          active ? 'border-brown-900 bg-brown-900 text-gold-200' : 'border-gold-200 bg-white text-brown-900 hover:border-gold-400'
        }`}
      >
        {label}
        {count != null && <span className={active ? 'text-gold-400' : 'text-brown-700/60'}>{count}</span>}
      </button>
    </li>
  )
}

function ProductSummary({ product }: { product: CategoryProduct }) {
  const price = getPriceLabel({ unit: product.unit, priceTiers: product.priceTiers, priceRange: product.priceRange })
  return (
    <div className="mt-4 flex flex-col gap-3 border-y border-gold-200 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-ink-900">
          <span className="font-semibold">{price.main}</span> <span className="text-brown-700">{price.per}</span>
          {price.tierHint && <span className="ml-2 text-sm font-medium text-status-ok">· {price.tierHint}</span>}
        </p>
        <FeatureChips features={product.features} />
      </div>
      <Link href={product.href} className="shrink-0 text-sm font-semibold text-brown-900 underline underline-offset-4">
        Fiche complète →
      </Link>
    </div>
  )
}

const tileClass =
  'group flex h-full w-full flex-col border border-gold-200 bg-white text-left transition hover:border-gold-400 focus-visible:outline-2 focus-visible:outline-brown-900'

function PatternTile({
  item,
  showProduct,
  href,
  onOpen,
}: {
  item: Extract<Item, { kind: 'pattern' }>
  showProduct: boolean
  href: string
  onOpen: () => void
}) {
  const { pattern: p, product } = item
  const out = p.availability === 'epuise'
  const price = p.priceOverride ?? getTierPrice(product.priceTiers, 1)
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        onOpen()
      }}
      className={tileClass}
    >
      <div className="relative overflow-hidden">
        <SanityImage
          image={p.image}
          alt={`Motif ${p.code} – ${p.name}`}
          aspect={1}
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
          className={`aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03] ${out ? 'opacity-50 grayscale' : ''}`}
        />
        <AvailabilityBadge availability={p.availability} className="absolute left-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        {showProduct && <p className="truncate text-xs uppercase tracking-wide text-brown-700/80">{product.title}</p>}
        <p className="pattern-code text-base text-brown-900">{p.code}</p>
        <p className="truncate text-sm text-brown-700">{p.name}</p>
        <p className="mt-auto pt-1 text-sm font-semibold text-ink-900">{formatPrice(price)}</p>
      </div>
    </a>
  )
}

function ProductTile({ product }: { product: CategoryProduct }) {
  const price = getPriceLabel({ unit: product.unit, priceTiers: product.priceTiers, priceRange: product.priceRange })
  return (
    <Link href={product.href} className={tileClass}>
      <div className="relative overflow-hidden">
        <SanityImage
          image={product.image}
          alt=""
          aspect={1}
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs uppercase tracking-wide text-brown-700/80">Produit</p>
        <p className="line-clamp-2 font-serif text-base leading-tight text-brown-900">{product.title}</p>
        <p className="mt-auto pt-1 text-sm font-semibold text-ink-900">{price.main}</p>
      </div>
    </Link>
  )
}
