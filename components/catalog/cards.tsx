import Link from 'next/link'
import { getPriceLabel } from '@/lib/display'
import type { PriceTier, Unit } from '@/lib/types'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'

export interface CategoryCardData {
  _id: string
  title: string | null
  slug: string | null
  description?: string | null
  image: SanityImageData | null
  productCount?: number
}

/** Carte catégorie : photo réelle, nom posé sur l'image, format peu haut. */
export function CategoryCard({
  category,
  priority,
  wideOnMobile = false,
}: {
  category: CategoryCardData
  priority?: boolean
  /** Sur mobile, occupe toute la largeur (grille de 2 avec 5 catégories). */
  wideOnMobile?: boolean
}) {
  return (
    <Link
      href={`/${category.slug}`}
      className={`group relative block overflow-hidden bg-brown-900 ${
        wideOnMobile ? 'col-span-2 aspect-2/1 sm:col-span-1 sm:aspect-4/3' : 'aspect-4/3'
      }`}
    >
      <SanityImage
        image={category.image}
        alt=""
        sizes={wideOnMobile ? '(min-width: 1024px) 300px, (min-width: 640px) 33vw, 100vw' : '(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw'}
        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.05]"
        priority={priority}
      />
      <div className="absolute inset-0 bg-linear-to-t from-ink-900/75 via-ink-900/10 to-transparent" />
      <h3 className="absolute inset-x-0 bottom-0 p-3 font-serif text-lg leading-tight text-white sm:text-xl">
        {category.title}
      </h3>
    </Link>
  )
}

export interface ProductCardData {
  _id: string
  title: string | null
  slug: string | null
  categorySlug: string | null
  unit: string | null
  priceTiers: { minQty: number | null; unitPrice: number | null }[]
  priceRange: { min?: number | null; max?: number | null } | null
  features: string[]
  mainImage: SanityImageData | null
  patternCount: number
  hasPatterns: boolean
}

export function toPricing(p: Pick<ProductCardData, 'unit' | 'priceTiers' | 'priceRange'>) {
  return {
    unit: (p.unit ?? 'piece') as Unit,
    priceTiers: p.priceTiers.filter((t): t is PriceTier => t.minQty != null && t.unitPrice != null),
    priceRange: p.priceRange,
  }
}

/**
 * Carte produit : photo, nom, prix. Toutes les cartes ont la même taille
 * (photo carrée, titre sur 2 lignes réservées). Les caractéristiques, l'unité
 * et les paliers sont sur la page produit.
 */
export function ProductCard({ product }: { product: ProductCardData }) {
  const price = getPriceLabel(toPricing(product))
  return (
    <Link
      href={`/${product.categorySlug}/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-gold-200 bg-white transition hover:border-gold-400"
    >
      <div className="relative aspect-square overflow-hidden">
        <SanityImage
          image={product.mainImage}
          alt=""
          aspect={1}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {product.hasPatterns && product.patternCount > 0 && (
          <span className="absolute bottom-2 left-2 bg-white/90 px-2.5 py-1 text-xs font-medium text-brown-900">
            {product.patternCount} motifs
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {/* 2 lignes réservées : même hauteur de carte quel que soit le nom. */}
        <h3 className="line-clamp-2 min-h-[2.5em] font-serif text-base leading-tight text-brown-900 sm:text-lg">
          {product.title}
        </h3>
        <p className="mt-2 font-semibold text-ink-900">{price.main}</p>
      </div>
    </Link>
  )
}
