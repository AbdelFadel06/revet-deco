import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import type { ClientReturn, QueryParams } from 'next-sanity'
import { client } from './client'

/** Un tag de cache par type de document : le webhook invalide `_type`. */
export type ContentTag = 'siteSettings' | 'category' | 'product' | 'patternFamily' | 'pattern'

/**
 * Exécute une requête GROQ mise en cache par Next (« use cache »).
 * Le cache dure jusqu'à ce que le webhook Sanity appelle `revalidateTag(tag)`
 * pour un des types dont dépend la requête.
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
  'use cache'
  cacheLife('max')
  cacheTag(...tags)
  return client.fetch<ClientReturn<Query, unknown>>(query, params)
}
