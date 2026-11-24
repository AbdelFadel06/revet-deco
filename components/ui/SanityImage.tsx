'use client'

import Image, { type ImageLoader } from 'next/image'
import type { SanityImageSource } from '@sanity/image-url'
import { urlFor } from '@/sanity/lib/image'
import { useSlowConnection } from './useSlowConnection'

export interface SanityImageData {
  asset: { _ref: string } | null
  crop?: unknown
  hotspot?: unknown
  lqip?: string | null
  width?: number | null
  height?: number | null
}

interface Props {
  image: SanityImageData | null | undefined
  alt: string
  /** Rapport hauteur / largeur imposé (1 = carré). Sinon, proportions d'origine. */
  aspect?: number
  sizes: string
  className?: string
  priority?: boolean
  /** « eager » : charger tout de suite même hors écran (ex. diapositive suivante). */
  loading?: 'eager' | 'lazy'
}

/**
 * Image Sanity servie directement par le CDN Sanity, à la bonne largeur
 * (pas de double optimisation par Next), au format le plus léger accepté par
 * le navigateur (AVIF/WebP), avec placeholder flou (LQIP) et chargement
 * différé (lazy) sauf pour les images prioritaires.
 * Connexion lente : qualité réduite pour les images non prioritaires.
 */
export function SanityImage({ image, alt, aspect, sizes, className, priority, loading }: Props) {
  const slow = useSlowConnection()
  if (!image?.asset) {
    return <div className={`bg-gold-200/40 ${className ?? ''}`} aria-hidden />
  }
  const source = image as SanityImageSource
  const w = image.width ?? 800
  const h = aspect ? Math.round(w * aspect) : (image.height ?? 800)

  const loader: ImageLoader = ({ width, quality }) => {
    let b = urlFor(source).width(width).quality(quality ?? 70)
    if (aspect) b = b.height(Math.round(width * aspect)).fit('crop')
    return b.url()
  }

  return (
    <Image
      loader={loader}
      src={image.asset._ref}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes}
      // 70 : bon compromis netteté / poids (CLAUDE.md §9) ; 50 sur réseau lent.
      quality={slow && !priority ? 50 : 70}
      priority={priority}
      loading={priority ? undefined : loading}
      placeholder={image.lqip ? 'blur' : 'empty'}
      blurDataURL={image.lqip ?? undefined}
      decoding="async"
      className={`bg-cream-50 ${className ?? ''}`}
    />
  )
}
