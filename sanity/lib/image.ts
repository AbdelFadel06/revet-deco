import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { dataset, projectId } from '../env'

const builder = createImageUrlBuilder({ projectId, dataset })

/**
 * URL d'une image Sanity : format automatique (WebP/AVIF), qualité 75
 * (voir CLAUDE.md §9). Respecte le recadrage et le hotspot du Studio.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto('format').quality(75)
}
