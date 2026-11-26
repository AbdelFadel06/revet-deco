import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BrandLoader } from '@/components/ui/BrandLoader'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { SanityImageSource } from '@sanity/image-url'
import { AvailabilityBadge } from '@/components/catalog/badges'
import { toPricing } from '@/components/catalog/cards'
import { PatternGallery, type GalleryPhoto } from '@/components/catalog/pattern/PatternGallery'
import { PatternPurchase } from '@/components/catalog/pattern/PatternPurchase'
import { patternHref } from '@/lib/routes'
import { SanityImage } from '@/components/ui/SanityImage'
import { formatPrice } from '@/lib/format'
import { getTierPrice } from '@/lib/pricing'
import { AVAILABILITIES, type Availability } from '@/lib/types'
import { getPattern, getPatternParams } from '@/sanity/lib/data'
import { urlFor } from '@/sanity/lib/image'

/** Valeur fictive : Cache Components exige au moins un paramètre au build. */
const PLACEHOLDER = { category: '__aucune-categorie__', product: '__aucun-produit__', code: '__AUCUN__' }

export async function generateStaticParams() {
  const params = await getPatternParams()
  return params.length > 0 ? params : [PLACEHOLDER]
}

const asAvailability = (a: string | null): Availability =>
  (AVAILABILITIES as readonly string[]).includes(a ?? '') ? (a as Availability) : 'disponible'

export async function generateMetadata({ params }: PageProps<'/[category]/[product]/[code]'>): Promise<Metadata> {
  const { category, product, code } = await params
  const data = await getPattern(category, product, decodeURIComponent(code))
  if (!data?.product) return {}
  const price = data.priceOverride ?? getTierPrice(toPricing(data.product).priceTiers, 1)
  const title = `${data.code} – ${data.name} · ${data.product.title}`
  const description = `${data.product.title}, motif ${data.code} « ${data.name} » à ${formatPrice(price)}. Commandez sur WhatsApp.`
  // Aperçu WhatsApp / Facebook : la photo principale du motif.
  const image = data.image?.asset
    ? urlFor(data.image as SanityImageSource).width(1200).height(630).fit('crop').quality(80).url()
    : undefined
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [{ url: image, width: 1200, height: 630 }] : [] },
  }
}

async function PatternContent({ params }: { params: PageProps<'/[category]/[product]/[code]'>['params'] }) {
  const { category, product, code } = await params
  const data = await getPattern(category, product, decodeURIComponent(code))
  if (!data?.product || !data.code) notFound()

  const pricing = toPricing(data.product)
  const photos: GalleryPhoto[] =
    data.photos.length > 0
      ? data.photos
      : data.image
        ? [{ ...data.image, _key: 'principale', caption: null, isRender: false }]
        : []
  const productHref = `/${category}/${product}`
  const basePrice = getTierPrice(pricing.priceTiers, 1)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
      <nav aria-label="Fil d’Ariane" className="text-sm text-brown-700">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{' '}
        /{' '}
        <Link href={`/${category}`} className="hover:underline">
          {data.product.category?.title}
        </Link>{' '}
        /{' '}
        <Link href={productHref} className="hover:underline">
          {data.product.title}
        </Link>{' '}
        / <span aria-current="page">{data.code}</span>
      </nav>

      <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-12">
        <PatternGallery
          photos={photos}
          alt={`Motif ${data.code} – ${data.name ?? ''}`}
          dimmed={data.availability === 'epuise'}
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
        <div className="md:pt-2">
          <PatternPurchase
            headingLevel="h1"
            shareUrl={patternHref(category, product, data.code)}
            product={{
              id: data.product._id,
              title: data.product.title ?? '',
              unit: pricing.unit,
              priceTiers: pricing.priceTiers,
              features: data.product.features,
            }}
            pattern={{
              code: data.code,
              name: data.name ?? '',
              availability: asAvailability(data.availability),
              priceOverride: data.priceOverride ?? null,
            }}
          />
          <Link
            href={productHref}
            className="mt-6 inline-block text-sm font-semibold text-brown-900 underline underline-offset-4"
          >
            Voir tous les motifs {data.product.title?.toLowerCase().startsWith('papier') ? 'de ce papier peint' : 'de ce produit'} →
          </Link>
        </div>
      </div>

      {/* Motifs similaires (même famille) */}
      {data.similar.length > 0 && (
        <section className="mt-14" aria-labelledby="similar-title">
          <h2 id="similar-title" className="font-serif text-2xl text-brown-900">
            {data.familyTitle ? `Dans la même famille : ${data.familyTitle}` : 'Motifs similaires'}
          </h2>
          <div className="mt-2 h-px w-16 bg-gold-400" aria-hidden />
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {data.similar
              .filter((p): p is typeof p & { code: string } => Boolean(p.code))
              .slice(0, data.similar.length % 2 === 0 ? undefined : -1)
              .map((p) => (
                <li key={p._id}>
                  <Link
                    href={patternHref(category, product, p.code)}
                    className="group flex h-full flex-col border border-gold-200 bg-white transition hover:border-gold-400"
                  >
                    <div className="relative overflow-hidden">
                      <SanityImage
                        image={p.image}
                        alt={`Motif ${p.code} – ${p.name}`}
                        aspect={1}
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
                        className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <AvailabilityBadge availability={p.availability} className="absolute left-2 top-2" />
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="pattern-code text-base text-brown-900">{p.code}</p>
                      <p className="truncate text-sm text-brown-700">{p.name}</p>
                      <p className="mt-auto pt-1 text-sm font-semibold text-ink-900">
                        {formatPrice(p.priceOverride ?? basePrice)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/**
 * La lecture de l'adresse (params) est placée sous <Suspense> : la navigation
 * affiche tout de suite la structure de la page (loader de la boutique), puis
 * le contenu arrive en flux (navigation instantanée, Cache Components).
 */
export default function PatternPage(props: PageProps<'/[category]/[product]/[code]'>) {
  return (
    <Suspense fallback={<BrandLoader />}>
      <PatternContent params={props.params} />
    </Suspense>
  )
}
