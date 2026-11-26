import Link from 'next/link'
import { CategoryCard, ProductCard } from '@/components/catalog/cards'
import { AvailabilityBadge } from '@/components/catalog/badges'
import { ChevronRightIcon } from '@/components/ui/icons'
import { SanityImage } from '@/components/ui/SanityImage'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { WhyUs } from '@/components/home/WhyUs'
import { ExpandableGrid } from '@/components/ui/ExpandableGrid'
import { evenSlice } from '@/lib/display'
import { getHome } from '@/sanity/lib/data'
import type { HOME_QUERY_RESULT } from '@/sanity/types'

/** Titre + bouton du hero (texte blanc, posé sur les photos). */
function HeroText({ ctaHref }: { ctaHref: string | null }) {
  return (
    <div>
      <h1 className="font-serif text-[2.6rem] uppercase leading-[0.95] text-white sm:text-6xl lg:text-7xl">
        Transformez
        <br />
        votre intérieur
      </h1>
      <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">
        Papier peint, sols, plafonds et finitions, sans gros travaux.
      </p>
      {ctaHref && (
        <Link
          href={ctaHref}
          className="mt-6 inline-flex min-h-12 items-center gap-2 bg-white px-6 text-sm font-semibold uppercase tracking-[0.12em] text-brown-900 transition hover:bg-cream-50"
        >
          Voir le catalogue <ChevronRightIcon className="size-4" />
        </Link>
      )}
    </div>
  )
}

export default async function HomePage() {
  const { whyUsImage, heroSlides, categories, featuredProducts, featuredPatterns } = await getHome()
  const firstCategory = categories.find((c) => !c.isSeasonal) ?? categories[0]
  // Nombre pair : rangées complètes sur mobile (2 colonnes).
  const slides: HOME_QUERY_RESULT['heroSlides'][number][] = heroSlides
  // Image de secours pour « Pourquoi nous choisir » : la première photo du carrousel.
  const firstImageSlide = slides.flatMap((s) => (s._type === 'image' ? [s] : []))[0] ?? null
  const patterns = evenSlice(featuredPatterns)
  const products = evenSlice(featuredProducts)

  return (
    <>
      {/* Hero pleine largeur : carrousel des réalisations sous l'en-tête transparent */}
      {heroSlides.length > 0 ? (
        <HeroCarousel slides={heroSlides}>
          <HeroText ctaHref={firstCategory ? `/${firstCategory.slug}` : null} />
        </HeroCarousel>
      ) : (
        <section className="-mt-16 bg-brown-900 px-5 pb-16 pt-32 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <HeroText ctaHref={firstCategory ? `/${firstCategory.slug}` : null} />
          </div>
        </section>
      )}


      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Catégories */}
        <section className="mt-14" aria-labelledby="cat-title">
          <h2 id="cat-title" className="text-center font-serif text-3xl text-brown-900">
            Nos univers
          </h2>
          <div className="mx-auto mt-2 h-px w-16 bg-gold-400" />
          <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 lg:gap-4">
            {categories.map((c, i) => (
              <CategoryCard key={c._id} category={c} wideOnMobile={i === 0} />
            ))}
          </div>
        </section>

        {/* Motifs coup de cœur : nombre pair, 4 d'abord puis « Voir plus » */}
        {patterns.length > 0 && (
          <section className="mt-16" aria-labelledby="motifs-title">
            <h2 id="motifs-title" className="font-serif text-3xl text-brown-900">
              Motifs coup de cœur
            </h2>
            <ExpandableGrid className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" label="Voir plus de motifs">
              {patterns.map((p) => (
                <Link key={p._id} href={`/${p.categorySlug}/${p.productSlug}/${encodeURIComponent(p.code ?? "")}`} className="group block">
                  <div className="relative overflow-hidden border border-gold-200">
                    <SanityImage
                      image={p.image}
                      alt={`Motif ${p.code} – ${p.name}`}
                      aspect={1}
                      sizes="(min-width: 1024px) 270px, 50vw"
                      className="aspect-square w-full object-cover transition group-hover:scale-[1.03]"
                    />
                    <AvailabilityBadge availability={p.availability} className="absolute left-2 top-2" />
                  </div>
                  <p className="pattern-code mt-2 text-brown-900">{p.code}</p>
                  <p className="truncate text-sm text-brown-700">{p.name}</p>
                </Link>
              ))}
            </ExpandableGrid>
          </section>
        )}

        {/* Produits mis en avant : nombre pair, 4 d'abord puis « Voir plus » */}
        {products.length > 0 && (
          <section className="mt-16" aria-labelledby="featured-title">
            <h2 id="featured-title" className="font-serif text-3xl text-brown-900">
              Les incontournables
            </h2>
            <ExpandableGrid className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4" label="Voir plus de produits">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </ExpandableGrid>
          </section>
        )}

        {/* Pourquoi nous choisir */}
        <WhyUs image={whyUsImage ?? firstImageSlide} />

        {/* Comment commander */}
        <section className="mt-16 border border-gold-400 bg-white p-6 sm:p-8" aria-labelledby="how-title">
          <h2 id="how-title" className="font-serif text-3xl text-brown-900">
            Comment commander ?
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              ['Choisissez', 'Parcourez les motifs et notez le code de ceux qui vous plaisent.'],
              ['Ajoutez au panier', 'Le prix se calcule tout seul, avec les remises par quantité.'],
              ['Envoyez sur WhatsApp', 'La boutique vous répond pour le paiement et la livraison.'],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brown-900 font-serif text-lg text-gold-400">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold text-brown-900">{title}</span>
                  <span className="text-sm text-brown-700">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  )
}
