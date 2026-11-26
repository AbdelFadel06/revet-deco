/** Adresse de la page d'un motif (utilisable côté serveur et côté navigateur). */
export const patternHref = (category: string, product: string, code: string) =>
  `/${category}/${product}/${encodeURIComponent(code)}`

/** Vrai si le lien ouvre bien Google Maps (et non une page de recherche Google). */
export function isGoogleMapsUrl(url: string): boolean {
  return /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(url)
}

/**
 * Lien « Voir sur la carte » : le lien Maps saisi dans le Studio s'il est valide,
 * sinon une recherche Google Maps sur le nom et l'adresse de la boutique.
 */
export function mapHref(mapUrl: string | null, shopName: string, address: string | null): string | null {
  if (mapUrl && isGoogleMapsUrl(mapUrl)) return mapUrl
  if (!mapUrl && !address) return null
  // Nom + 1re partie de l'adresse (le quartier) : les indications détaillées gênent la recherche Maps.
  const area = address?.split(/[,\n]/)[0]?.trim()
  const query = [shopName, area].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
