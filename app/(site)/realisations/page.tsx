import type { Metadata } from 'next'
import Link from 'next/link'
import { RealisationGrid } from '@/components/home/Realisations'
import { getRealisations } from '@/sanity/lib/data'

export const metadata: Metadata = {
  title: 'Réalisations & inspirations',
  description:
    'Nos chantiers et des idées déco en vidéo : papier peint, marbre adhésif, tasseaux, sols PVC… Trouvez le rendu qui vous plaît et commandez sur WhatsApp.',
}

export default async function RealisationsPage() {
  const items = await getRealisations()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6">
      <nav aria-label="Fil d’Ariane" className="text-sm text-brown-700">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>{' '}
        / <span aria-current="page">Réalisations & inspirations</span>
      </nav>
      <h1 className="mt-4 font-serif text-4xl text-brown-900">Réalisations & inspirations</h1>
      <div className="mt-2 h-px w-16 bg-gold-400" aria-hidden />
      <p className="mt-3 max-w-2xl text-brown-700">
        Nos chantiers et des idées pour transformer votre intérieur à petit budget. Touchez une vidéo pour la voir, et
        retrouvez les produits pour obtenir le même rendu.
      </p>

      {items.length > 0 ? (
        <RealisationGrid items={items} paginate filters />
      ) : (
        <p className="mt-10 text-brown-700">Les premières réalisations arrivent bientôt.</p>
      )}
    </div>
  )
}
