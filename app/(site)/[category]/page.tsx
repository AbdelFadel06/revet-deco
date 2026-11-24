import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/catalog/cards'
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

export default async function CategoryPage({ params }: PageProps<'/[category]'>) {
  const { category } = await params
  const data = await getCategory(category)
  if (!data) notFound()

  return (
    <>
      <section className="bg-brown-900 text-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <nav aria-label="Fil d’Ariane" className="text-sm text-gold-200/80">
            <Link href="/" className="hover:text-gold-400">
              Accueil
            </Link>{' '}
            / <span aria-current="page">{data.title}</span>
          </nav>
          <h1 className="mt-3 font-serif text-4xl text-gold-200">{data.title}</h1>
          {data.description && <p className="mt-3 max-w-2xl text-cream-50/85">{data.description}</p>}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {data.products.length === 0 ? (
          <p className="py-12 text-center text-brown-700">Aucun produit dans cette catégorie pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
