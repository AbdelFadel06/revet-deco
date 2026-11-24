'use client'

import Image, { type ImageLoader } from 'next/image'
import type { SanityImageSource } from '@sanity/image-url'
import { urlFor } from '@/sanity/lib/image'

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
 * (pas de double optimisation par Next), avec placeholder flou (LQIP).
 */
export function SanityImage({ image, alt, aspect, sizes, className, priority, loading }: Props) {
  if (!image?.asset) {
    return <div className={`bg-gold-200/40 ${className ?? ''}`} aria-hidden />
  }
  const source = image as SanityImageSource
  const w = image.width ?? 800
  const h = aspect ? Math.round(w * aspect) : (image.height ?? 800)

  const loader: ImageLoader = ({ width, quality }) => {
    let b = urlFor(source).width(width).quality(quality ?? 75)
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
      quality={75}
      priority={priority}
      loading={priority ? undefined : loading}
      placeholder={image.lqip ? 'blur' : 'empty'}
      blurDataURL={image.lqip ?? undefined}
      className={className}
    />
  )
}
