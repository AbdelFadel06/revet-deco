import 'server-only'

import { normalizeCode } from '@/lib/format'
import { sanityFetch } from './fetch'
import {
  CART_CATALOG_QUERY,
  CATEGORY_QUERY,
  CATEGORY_SLUGS_QUERY,
  FAMILY_PATHS_QUERY,
  FAMILY_QUERY,
  HOME_QUERY,
  NAV_CATEGORIES_QUERY,
  PRODUCT_PATHS_QUERY,
  PRODUCT_QUERY,
  SEARCH_QUERY,
  SETTINGS_QUERY,
} from './queries'

/**
 * Point d'entrée unique des pages vers Sanity.
 * Chaque fonction déclare TOUS les types de documents lus par sa requête :
 * le webhook n'a qu'à invalider le type modifié.
 */

export const getSettings = () => sanityFetch({ query: SETTINGS_QUERY, tags: ['siteSettings'] })

export const getNavCategories = () => sanityFetch({ query: NAV_CATEGORIES_QUERY, tags: ['category', 'product'] })

export const getHome = () =>
  sanityFetch({ query: HOME_QUERY, tags: ['siteSettings', 'category', 'product', 'pattern', 'patternFamily'] })

export const getCategory = (category: string) =>
  sanityFetch({ query: CATEGORY_QUERY, params: { category }, tags: ['category', 'product', 'pattern'] })

export const getProduct = (category: string, product: string) =>
  sanityFetch({
    query: PRODUCT_QUERY,
    params: { category, product },
    tags: ['category', 'product', 'patternFamily', 'pattern'],
  })

export const getFamily = (category: string, product: string, family: string) =>
  sanityFetch({
    query: FAMILY_QUERY,
    params: { category, product, family },
    tags: ['category', 'product', 'patternFamily', 'pattern'],
  })

export async function search(rawTerm: string) {
  const term = rawTerm.trim().slice(0, 60)
  if (!term) return { patterns: [], products: [] }
  return sanityFetch({
    query: SEARCH_QUERY,
    params: { term: `${term}*`, code: normalizeCode(term) },
    tags: ['category', 'product', 'patternFamily', 'pattern'],
  })
}

export function getCartCatalog(productIds: string[], codes: string[]) {
  // Tri : même panier dans un ordre différent → même entrée de cache.
  return sanityFetch({
    query: CART_CATALOG_QUERY,
    params: { productIds: [...new Set(productIds)].sort(), codes: [...new Set(codes.map(normalizeCode))].sort() },
    tags: ['category', 'product', 'patternFamily', 'pattern'],
  })
}

// --- generateStaticParams ---------------------------------------------------

const hasAll = <K extends string>(keys: K[]) =>
  (row: Partial<Record<K, string | null>>): row is Record<K, string> => keys.every((k) => Boolean(row[k]))

export async function getCategoryParams() {
  const rows = await sanityFetch({ query: CATEGORY_SLUGS_QUERY, tags: ['category'] })
  return rows.filter(hasAll(['category']))
}

export async function getProductParams() {
  const rows = await sanityFetch({ query: PRODUCT_PATHS_QUERY, tags: ['category', 'product'] })
  return rows.filter(hasAll(['category', 'product']))
}

export async function getFamilyParams() {
  const rows = await sanityFetch({ query: FAMILY_PATHS_QUERY, tags: ['category', 'product', 'patternFamily'] })
  return rows.filter(hasAll(['category', 'product', 'family']))
}
