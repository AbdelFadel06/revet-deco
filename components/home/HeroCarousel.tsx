'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'
import { useSlowConnection } from '@/components/ui/useSlowConnection'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImageSource } from '@sanity/image-url'

type Common = { _key: string; caption: string | null; alt: string | null }
export type HeroSlide =
  | (Common & SanityImageData & { _type: 'image' })
  | (Common & { _type: 'heroVideo'; mp4: string | null; av1: string | null; poster: SanityImageData | null })

const IMAGE_DURATION = 5500
const noopSubscribe = () => () => {}


const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Hero pleine largeur : photos et/ou courtes vidéos des réalisations, sous
 * l'en-tête transparent. Défilement natif (glisser au doigt).
 * - Photo : affichée 5,5 s.
 * - Vidéo : seule la vidéo visible est lue ; on passe à la suivante à la fin.
 *   Mobile : plein écran. Ordinateur : cadre vertical à droite sur fond flouté
 *   (les vidéos sont tournées au téléphone, en 9:16).
 * L'interaction de l'utilisateur met la lecture automatique en pause.
 */
export function HeroCarousel({ slides, children }: { slides: HeroSlide[]; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = slides.length
  // Connexion lente / économiseur de données : pas de vidéo, seulement les images d'attente.
  const slow = useSlowConnection()
  // Côté serveur, on ne connaît pas la connexion : aucune vidéo n'est préchargée
  // tant que la page n'a pas vérifié le réseau dans le navigateur.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const playsVideo = (i: number) => slides[i]?._type === 'heroVideo' && !slow

  const goTo = (i: number) => {
    const track = trackRef.current
    if (!track || n === 0) return
    track.scrollTo({ left: (((i % n) + n) % n) * track.clientWidth, behavior: 'smooth' })
  }

  // Photos : avance automatique après un délai. Vidéos : avance à la fin (onEnded).
  useEffect(() => {
    if (paused || n < 2 || prefersReducedMotion()) return
    if (playsVideo(index)) return
    const id = window.setTimeout(() => goTo(index + 1), IMAGE_DURATION)
    return () => window.clearTimeout(id)
    // goTo ne dépend que de refs et de n
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, n, slides, slow])

  // Lecture : uniquement la diapositive visible.
  useEffect(() => {
    const reduced = prefersReducedMotion()
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === index && !reduced && !slow) {
        v.play().catch(() => {
          // Lecture refusée (économie de données…) : l'image d'attente reste affichée.
        })
      } else {
        v.pause()
      }
    })
  }, [index, slow])

  const current = slides[index]

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Nos réalisations"
      // -mt-16 : le hero passe sous l'en-tête transparent (hauteur 4rem).
      className="relative -mt-16 h-[88svh] min-h-140 overflow-hidden bg-ink-900 sm:h-[94svh] sm:min-h-160"
      onPointerDown={() => setPaused(true)}
    >
      <div
        ref={trackRef}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scrollbar-none"
      >
        {slides.map((s, i) => (
          <div
            key={s._key}
            className="relative h-full w-full shrink-0 snap-start overflow-hidden"
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${i + 1} sur ${n}${s.caption ? ` : ${s.caption}` : ''}`}
          >
            {s._type === 'image' ? (
              <SanityImage
                image={s}
                alt={s.alt ?? s.caption ?? ''}
                sizes="100vw"
                className="absolute inset-0 size-full object-cover"
                priority={i === 0}
                loading={i <= index + 1 ? 'eager' : 'lazy'}
              />
            ) : (
              <>
                {/* Fond flouté (ordinateur) à partir de l'image d'attente */}
                {s.poster?.asset && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urlFor(s.poster as SanityImageSource).width(640).quality(50).url()}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 hidden size-full scale-110 object-cover blur-2xl brightness-75 sm:block"
                  />
                )}
                {/* Cadre de la vidéo : plein écran sur mobile, vertical à droite sur ordinateur. */}
                <div className="absolute inset-0 overflow-hidden sm:inset-auto sm:right-[7%] sm:top-1/2 sm:aspect-9/16 sm:h-[76%] sm:-translate-y-1/2 sm:shadow-2xl sm:ring-1 sm:ring-white/20">
                  {/* Image d'attente : vraie image optimisée (prioritaire pour la 1re), visible
                      tant que la vidéo ne joue pas — et seule affichée sur réseau lent. */}
                  <SanityImage
                    image={s.poster}
                    alt=""
                    sizes="(min-width: 640px) 45vh, 100vw"
                    className="absolute inset-0 size-full object-cover"
                    priority={i === 0}
                    loading={i <= index + 1 ? 'eager' : 'lazy'}
                  />
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el
                    }}
                    muted
                    playsInline
                    loop={paused || n === 1}
                    // Seules la vidéo affichée et la suivante se téléchargent ; rien sur réseau lent
                    // ni avant que le navigateur ait vérifié la connexion.
                    preload={!mounted || slow ? 'none' : i === index ? 'auto' : i === index + 1 ? 'metadata' : 'none'}
                    onEnded={() => !paused && goTo(i + 1)}
                    aria-label={s.alt ?? s.caption ?? 'Vidéo de réalisation'}
                    className="absolute inset-0 size-full object-cover"
                  >
                    {/* AV1 d'abord (plus léger) ; H.264 lu partout. */}
                    {s.av1 && <source src={s.av1} type='video/mp4; codecs="av01.0.05M.10"' />}
                    {s.mp4 && <source src={s.mp4} type="video/mp4" />}
                  </video>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Voile pour la lisibilité du texte et de l'en-tête */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-900/80 via-ink-900/15 to-ink-900/30 sm:bg-linear-to-r sm:from-ink-900/75 sm:via-ink-900/25 sm:to-transparent" />

      {/* Contenu */}
      <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-7xl flex-col justify-end px-5 pb-16 sm:justify-center sm:px-8 sm:pb-0">
        <div className="pointer-events-auto max-w-2xl sm:max-w-xl">{children}</div>
      </div>

      {/* Légende + points */}
      {n > 0 && (
        // Mobile : en haut à droite. Ordinateur : en bas à gauche (la vidéo occupe la droite).
        <div className="absolute right-5 top-20 flex flex-col items-end gap-3 sm:bottom-10 sm:left-[max(2rem,calc((100vw-80rem)/2+2rem))] sm:right-auto sm:top-auto sm:flex-row-reverse sm:items-center">

          {current?.caption && (
            <p className="border border-white/40 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {current.caption}
            </p>
          )}
          {n > 1 && (
            <div className="flex gap-1">
              {slides.map((s, i) => (
                <button
                  key={s._key}
                  type="button"
                  onClick={() => {
                    setPaused(true)
                    goTo(i)
                  }}
                  aria-label={`Diapositive ${i + 1}`}
                  aria-current={i === index}
                  className="flex h-6 w-7 items-center justify-center"
                >
                  <span className={`block h-1 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-3 bg-white/50'}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
