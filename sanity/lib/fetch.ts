import 'server-only'

import type { ClientReturn, QueryParams } from 'next-sanity'
import { client } from './client'

/** Un tag de cache par type de document : le webhook invalide `_type`. */
export type ContentTag = 'siteSettings' | 'category' | 'product' | 'patternFamily' | 'pattern' | 'realisation'

/**
 * Exécute une requête GROQ mise en cache par Next.js (cache des requêtes `fetch`,
 * étiqueté par type de document). Le cache dure jusqu'à ce que le webhook Sanity
 * appelle `revalidateTag(tag)` pour un des types dont dépend la requête.
 * En développement (Sanity ne peut pas joindre localhost) : 5 secondes, pour voir
 * les modifications du Studio en rechargeant la page.
 *
 * Les types de retour viennent de Sanity TypeGen (`sanity/types.ts`), qui
 * associe chaque requête `defineQuery` à son type de résultat.
 */
export async function sanityFetch<const Query extends string>({
  query,
  params = {},
  tags,
}: {
  query: Query
  params?: QueryParams
  tags: ContentTag[]
}): Promise<ClientReturn<Query, unknown>> {
  return client.fetch<ClientReturn<Query, unknown>>(query, params, {
    next: { tags, revalidate: process.env.NODE_ENV === 'development' ? 5 : false },
  })
}
