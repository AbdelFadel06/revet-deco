import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

/**
 * Client en lecture. Pas de CDN Sanity : c'est Next qui met en cache
 * (voir `sanityFetch`), et le webhook invalide ce cache à chaque publication.
 * Avec le CDN, on risquerait de remettre en cache une donnée périmée.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
})
