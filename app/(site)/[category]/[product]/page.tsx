import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from 'next-sanity'
import { AvailabilityBadge, FeatureChips } from '@/components/catalog/badges'
import { toPricing } from '@/components/catalog/cards'
import { PatternBrowser, type BrowserPattern } from '@/components/catalog/PatternBrowser'
import { SimpleAddToCart } from '@/components/catalog/SimpleAddToCart'
import { SanityImage } from '@/components/ui/SanityImage'
import { getPriceLabel } from '@/lib/display'
import { AVAILABILITIES, type Availability } from '@/lib/types'
import { urlFor } from '@/sanity/lib/image'
import { getProduct, getProductParams } from '@/sanity/lib/data'

const PLACEHOLDER = { category: '__aucune-categorie__', product: '__aucun-produit__' }

export async function generateStaticParams() {
  const params = await getProductParams()
  return params.length > 0 ? params : [PLACEHOLDER]
}

const asAvailability = (a: string | null): Availability =>
  (AVAILABILITIES as readonly string[]).includes(a ?? '') ? (a as Availability) : 'disponible'

export async function generateMetadata({ params }: PageProps<'/[category]/[product]'>): Promise<Metadata> {
  const { category, product } = await params
  const data = await getProduct(category, product)
  if (!data) return {}
  const image = data.mainImage?.asset ? urlFor(data.mainImage).width(1200).height(630).fit('crop').url() : undefined
  return {
    title: data.title ?? undefined,
    description: data.shortDescription ?? undefined,
    openGraph: { title: data.title ?? undefined, description: data.shortDescription ?? undefined, images: image ? [image] : [] },
  }
}

export default async function ProductPage({ params }: PageProps<'/[category]/[product]'>) {
  const { category, product } = await params
  const data = await getProduct(category, product)
  if (!data) notFound()

  const pricing = toPricing(data)
  const price = getPriceLabel(pricing)
  const productAvailability = asAvailability(data.availability)

  const patterns: BrowserPattern[] = data.patterns
    .filter((p) => p.code)
    .map((p) => ({
      _id: p._id,
      code: p.code!,
      name: p.name ?? '',
      availability: asAvailability(p.availability),
      priceOverride: p.priceOverride ?? null,
      familySlug: p.familySlug,
      image: p.image,
    }))
  const families = data.families
    .filter((f) => f.slug)
    .map((f) => ({ slug: f.slug!, title: f.title ?? f.slug!, count: f.patternCount }))
    .filter((f) => f.count > 0)

  const showPatterns = data.hasPatterns && patterns.length > 0

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <nav aria-label="Fil d’Ariane" className="text-sm text-brown-700">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{' '}
        /{' '}
        <Link href={`/${data.category?.slug}`} className="hover:underline">
          {data.category?.title}
        </Link>{' '}
        / <span aria-current="page">{data.title}</span>
      </nav>

      <div className={`mt-4 grid gap-6 ${showPatterns ? 'md:grid-cols-[1fr_2fr]' : 'md:grid-cols-2'}`}>
        <div className="overflow-hidden border border-gold-200 bg-white">
          <SanityImage
            image={data.mainImage}
            alt={data.title ?? ''}
            aspect={1}
            sizes={showPatterns ? '(min-width: 768px) 33vw, 100vw' : '(min-width: 768px) 50vw, 100vw'}
            className="aspect-square w-full object-cover"
            priority
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-serif text-3xl text-brown-900 sm:text-4xl">{data.title}</h1>
            {data.shortDescription && <p className="mt-2 text-brown-700">{data.shortDescription}</p>}
          </div>

          <FeatureChips features={data.features} />

          <div>
            <p className="text-2xl font-semibold text-ink-900">
              {price.main} <span className="text-base font-normal text-brown-700">{price.per}</span>
            </p>
            {price.tierHint && (
              <p className="mt-1 inline-block bg-status-ok/10 px-3 py-1 text-sm font-medium text-status-ok">
                {price.tierHint}, tous motifs confondus
              </p>
            )}
          </div>

          {!data.hasPatterns && (
            <>
              <AvailabilityBadge availability={productAvailability} />
              <SimpleAddToCart
                product={{
                  id: data._id,
                  title: data.title ?? '',
                  unit: pricing.unit,
                  priceTiers: pricing.priceTiers,
                  availability: productAvailability,
                }}
              />
            </>
          )}

          <p className="text-sm text-brown-700">Disponibilité confirmée sur WhatsApp.</p>

          {data.description && (
            <div className="prose-sm max-w-none text-ink-900 [&_p]:mt-2">
              <PortableText value={data.description} />
            </div>
          )}
        </div>
      </div>

      {showPatterns && (
        <PatternBrowser
          product={{
            id: data._id,
            title: data.title ?? '',
            unit: pricing.unit,
            priceTiers: pricing.priceTiers,
            features: data.features,
          }}
          families={families}
          patterns={patterns}
        />
      )}

      {data.installTips && (
        <section className="mt-12 border border-gold-400 bg-white p-6">
          <h2 className="font-serif text-2xl text-brown-900">Conseils de pose</h2>
          <div className="mt-3 text-ink-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-2">
            <PortableText value={data.installTips} />
          </div>
        </section>
      )}
    </div>
  )
}
