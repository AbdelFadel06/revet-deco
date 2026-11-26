'use client'

import { useRef, useState } from 'react'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'

export interface GalleryPhoto extends SanityImageData {
  _key: string
  caption: string | null
  isRender: boolean
}

/**
 * Photos d'un motif, dans l'ordre choisi dans le Studio (la 1re est la
 * principale). Défilement au doigt, miniatures en dessous s'il y en a
 * plusieurs. Seules la photo affichée et la suivante se chargent tout de
 * suite ; les autres attendent qu'on fasse défiler.
 */
export function PatternGallery({
  photos,
  alt,
  dimmed = false,
  sizes,
  priority = false,
}: {
  photos: GalleryPhoto[]
  alt: string
  /** Motif épuisé : photos grisées */
  dimmed?: boolean
  sizes: string
  priority?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const n = photos.length

  const goTo = (i: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
  }

  if (n === 0) return <div className="aspect-square w-full bg-cream-50" aria-hidden />

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none"
          aria-roledescription={n > 1 ? 'carrousel' : undefined}
          aria-label={n > 1 ? `Photos du motif (${n})` : undefined}
        >
          {photos.map((p, i) => (
            <figure
              key={p._key}
              className="relative aspect-square w-full shrink-0 snap-start"
              aria-label={n > 1 ? `Photo ${i + 1} sur ${n}` : undefined}
            >
              <SanityImage
                image={p}
                alt={p.caption ? `${alt} – ${p.caption}` : alt}
                aspect={1}
                sizes={sizes}
                className={`size-full object-cover ${dimmed ? 'opacity-50 grayscale' : ''}`}
                priority={priority && i === 0}
                loading={i <= index + 1 ? 'eager' : 'lazy'}
              />
              {p.isRender && (
                <span className="absolute left-3 top-3 bg-brown-900/85 px-2.5 py-1 text-xs font-medium text-gold-200">
                  Simulation indicative
                </span>
              )}
              {p.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-900/70 to-transparent px-3 pb-2.5 pt-8 text-sm text-white">
                  {p.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        {n > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 bg-ink-900/60 px-2 py-0.5 text-xs font-medium text-white">
            {index + 1} / {n}
          </span>
        )}
      </div>

      {n > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto px-0.5 pb-0.5 scrollbar-none" aria-label="Miniatures">
          {photos.map((p, i) => (
            <li key={p._key} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Voir la photo ${i + 1}`}
                aria-current={i === index}
                className={`block size-14 overflow-hidden border-2 transition ${i === index ? 'border-brown-900' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <SanityImage image={p} alt="" aspect={1} sizes="56px" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
