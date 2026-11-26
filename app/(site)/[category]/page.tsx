import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BrandLoader } from '@/components/ui/BrandLoader'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { toPricing } from '@/components/catalog/cards'
import { CategoryBrowser, type CategoryProduct } from '@/components/catalog/CategoryBrowser'
import { AVAILABILITIES, type Availability } from '@/lib/types'
import { getCategory, getCategoryParams } from '@/sanity/lib/data'

/** Valeur fictive : Cache Components exige au moins un paramètre au build. */
const PLACEHOLDER = '__aucune-categorie__'

export async function generateStaticParams() {
  const params = await getCategoryParams()
  return params.length > 0 ? params : [{ category: PLACEHOLDER }]
}

export async function generateMetadata({ params }: PageProps<'/[category]'>): Promise<Metadata> {
  const { category } = await params
  const data = await getCategory(category)
  if (!data) return {}
  return {
    title: data.title ?? undefined,
    description: data.description ?? undefined,
  }
}

const asAvailability = (a: string | null): Availability =>
  (AVAILABILITIES as readonly string[]).includes(a ?? '') ? (a as Availability) : 'disponible'

async function CategoryContent({ params }: { params: PageProps<'/[category]'>['params'] }) {
  const { category } = await params
  const data = await getCategory(category)
  if (!data) notFound()

  // Données simples pour le composant client (tous les motifs de la catégorie).
  const products: CategoryProduct[] = data.products
    .filter((p): p is typeof p & { slug: string } => Boolean(p.slug))
    .map((p) => {
      const pricing = toPricing(p)
      return {
        id: p._id,
        slug: p.slug,
        href: `/${data.slug}/${p.slug}`,
        title: p.title ?? '',
        unit: pricing.unit,
        priceTiers: pricing.priceTiers,
        priceRange: p.priceRange,
        features: p.features,
        hasPatterns: p.hasPatterns,
        image: p.mainImage,
        patterns: p.patterns
          .filter((pat): pat is typeof pat & { code: string } => Boolean(pat.code))
          .map((pat) => ({
            _id: pat._id,
            code: pat.code,
            name: pat.name ?? '',
            availability: asAvailability(pat.availability),
            priceOverride: pat.priceOverride ?? null,
            familySlug: pat.familySlug,
            familyTitle: pat.familyTitle,
            image: pat.image,
            photos: pat.photos,
          })),
      }
    })

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:pt-8">
      {/* En-tête léger, sur fond blanc */}
      <nav aria-label="Fil d’Ariane" className="text-sm text-brown-700">
        <Link href="/" className="hover:text-brown-900 hover:underline">
          Accueil
        </Link>{' '}
        / <span aria-current="page">{data.title}</span>
      </nav>
      <h1 className="mt-2 font-serif text-4xl text-brown-900 sm:text-5xl">{data.title}</h1>
      {data.description && <p className="mt-2 max-w-2xl text-brown-700">{data.description}</p>}
      <div className="mt-2 h-px w-16 bg-gold-400" aria-hidden />

      <div className="mt-6">
        {products.length === 0 ? (
          <p className="py-12 text-center text-brown-700">Aucun produit dans cette catégorie pour le moment.</p>
        ) : (
          <CategoryBrowser products={products} categoryPath={`/${data.slug}`} />
        )}
      </div>
    </div>
  )
}

/**
 * La lecture de l'adresse (params) est placée sous <Suspense> : la navigation
 * affiche tout de suite la structure de la page (loader de la boutique), puis
 * le contenu arrive en flux (navigation instantanée, Cache Components).
 */
export default function CategoryPage(props: PageProps<'/[category]'>) {
  return (
    <Suspense fallback={<BrandLoader />}>
      <CategoryContent params={props.params} />
    </Suspense>
  )
}
