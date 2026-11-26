'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BeforeAfter } from '@/components/home/BeforeAfter'
import { ExpandableGrid } from '@/components/ui/ExpandableGrid'
import { ChevronRightIcon, CloseIcon } from '@/components/ui/icons'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'
import { useSlowConnection } from '@/components/ui/useSlowConnection'
import { patternHref } from '@/lib/routes'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImageSource } from '@sanity/image-url'
import type { HOME_QUERY_RESULT } from '@/sanity/types'

export type Realisation = HOME_QUERY_RESULT['realisations'][number]
type Media = Realisation['media'][number]

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' })
function formatDate(date: string | null): string | null {
  if (!date) return null
  const d = new Date(`${date}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : monthYear.format(d)
}

/** « Cotonou · nov. 2026 » pour une réalisation ; rien pour une inspiration. */
function subtitleOf(r: Realisation): string | null {
  if (r.kind === 'inspiration') return null
  return [r.place, formatDate(r.date)].filter(Boolean).join(' · ') || null
}

const PlayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
  </svg>
)

/** Image représentative d'un média (couverture, miniatures). */
function coverOf(m: Media | undefined): SanityImageData | null {
  if (!m) return null
  if (m._type === 'beforeAfter') return m.after
  if (m._type === 'realisationVideo') return m.poster
  return m
}

type KindFilter = 'tout' | 'realisation' | 'inspiration'
const FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'tout', label: 'Tout voir' },
  { value: 'realisation', label: 'Réalisations' },
  { value: 'inspiration', label: 'Inspirations' },
]

/**
 * Grille de réalisations / inspirations + fenêtre de visionnage (comparateur
 * avant / après, photos, vidéos, produits liés).
 * - `paginate` : 8 cartes puis « Voir plus » (page dédiée).
 * - `filters` : boutons Tout · Réalisations · Inspirations (si les deux existent).
 */
export function RealisationGrid({
  items,
  paginate = false,
  filters = false,
}: {
  items: Realisation[]
  paginate?: boolean
  filters?: boolean
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [kind, setKind] = useState<KindFilter>('tout')
  const open = items.find((r) => r._id === openId) ?? null
  const bothKinds = new Set(items.map((r) => r.kind)).size > 1
  const shown = kind === 'tout' ? items : items.filter((r) => r.kind === kind)

  const cards = shown.map((r) => <RealisationCard key={r._id} realisation={r} onOpen={() => setOpenId(r._id)} />)
  const gridClass = 'mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'

  return (
    <>
      {filters && bothKinds && (
        <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-none" role="group" aria-label="Filtrer">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setKind(f.value)}
              aria-pressed={kind === f.value}
              className="min-h-11 shrink-0 border border-gold-400 px-4 text-sm font-medium text-brown-900 transition aria-pressed:border-brown-900 aria-pressed:bg-brown-900 aria-pressed:text-gold-200"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {paginate ? (
        <ExpandableGrid key={kind} initial={8} step={8} className={gridClass} label="Voir plus">
          {cards}
        </ExpandableGrid>
      ) : (
        <div className={gridClass}>{cards}</div>
      )}
      {open && <RealisationViewer key={open._id} realisation={open} onClose={() => setOpenId(null)} />}
    </>
  )
}

// ---------------------------------------------------------------------------

function RealisationCard({ realisation: r, onOpen }: { realisation: Realisation; onOpen: () => void }) {
  const first = r.media[0]
  const hasVideo = r.media.some((m) => m._type === 'realisationVideo')
  const sizes = '(min-width: 1024px) 270px, 50vw'

  return (
    <button type="button" onClick={onOpen} className="group flex w-full flex-col self-start text-left">
      <div className="relative aspect-4/5 overflow-hidden border border-gold-200 bg-cream-50">
        {first?._type === 'beforeAfter' ? (
          // Aperçu fendu : moitié avant à gauche, moitié après à droite.
          <>
            <SanityImage image={first.after} alt="" aspect={1.25} sizes={sizes} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0" style={{ clipPath: 'inset(0 50% 0 0)' }}>
              <SanityImage image={first.before} alt="" aspect={1.25} sizes={sizes} className="absolute inset-0 size-full object-cover" />
            </div>
            <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white" aria-hidden />
          </>
        ) : (
          <SanityImage
            image={coverOf(first)}
            alt=""
            aspect={1.25}
            sizes={sizes}
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}

        {/* Repères : avant/après, vidéo, nombre de médias */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {r.kind === 'inspiration' && (
            <span className="bg-brown-900/85 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-200">
              Inspiration
            </span>
          )}
          {first?._type === 'beforeAfter' && (
            <span className="bg-white/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brown-900">
              Avant / après
            </span>
          )}
        </div>
        {hasVideo && (
          <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900/55 text-white backdrop-blur-sm">
            <PlayIcon className="ml-0.5 size-6" />
          </span>
        )}
        {r.media.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-ink-900/70 px-2 py-0.5 text-xs font-medium text-white">
            {r.media.length} médias
          </span>
        )}
      </div>
      <p className="mt-2 font-semibold leading-snug text-brown-900">{r.title}</p>
      {subtitleOf(r) && (
        <p className="truncate text-sm text-brown-700">{subtitleOf(r)}</p>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------

function RealisationViewer({ realisation: r, onClose }: { realisation: Realisation; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({})
  const [index, setIndex] = useState(0)
  const slow = useSlowConnection()
  const n = r.media.length

  useEffect(() => {
    const d = dialogRef.current
    if (d && !d.open) d.showModal()
  }, [])

  // Seule la vidéo affichée est lue (pas de lecture auto sur réseau lent).
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([i, v]) => {
      if (!v) return
      if (Number(i) === index && !slow) v.play().catch(() => {})
      else v.pause()
    })
  }, [index, slow])

  const goTo = (i: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: Math.min(n - 1, Math.max(0, i)) * track.clientWidth, behavior: 'smooth' })
  }

  const sizes = '(min-width: 640px) 448px, 100vw'
  const current = r.media[index]
  const patterns = r.patterns.filter((p) => p.code && p.productSlug && p.categorySlug)
  const products = r.products.filter((p) => p.slug && p.categorySlug)

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby="realisation-title"
      className="mx-auto mb-[max(0.75rem,env(safe-area-inset-bottom))] mt-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-none overflow-y-auto bg-white p-0 shadow-2xl backdrop:bg-ink-900/70 sm:m-auto sm:w-full sm:max-w-4xl"
    >
      <div className="grid sm:grid-cols-[28rem_1fr]">
        {/* Médias */}
        <div className="relative bg-ink-900">
          <div
            ref={trackRef}
            onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none"
          >
            {r.media.map((m, i) => (
              <div key={m._key} className="relative aspect-4/5 w-full shrink-0 snap-start">
                {m._type === 'beforeAfter' ? (
                  <BeforeAfter before={m.before} after={m.after} alt={r.title ?? 'Réalisation'} sizes={sizes} />
                ) : m._type === 'realisationVideo' ? (
                  <>
                    <SanityImage image={m.poster} alt="" sizes={sizes} className="absolute inset-0 size-full object-contain" />
                    {m.mp4 && (
                      <video
                        ref={(el) => {
                          videoRefs.current[i] = el
                        }}
                        poster={m.poster?.asset ? urlFor(m.poster as SanityImageSource).width(720).quality(70).url() : undefined}
                        muted
                        loop
                        playsInline
                        controls
                        preload={i === index && !slow ? 'auto' : 'none'}
                        aria-label={m.caption ?? `Vidéo – ${r.title}`}
                        className="absolute inset-0 size-full object-contain"
                      >
                        {/* AV1 d'abord (plus léger) ; H.264 lu partout. */}
                        {m.av1 && <source src={m.av1} type='video/mp4; codecs="av01.0.05M.10"' />}
                        <source src={m.mp4} type="video/mp4" />
                      </video>
                    )}
                  </>
                ) : (
                  <SanityImage
                    image={m}
                    alt={m.caption ?? r.title ?? ''}
                    sizes={sizes}
                    className="absolute inset-0 size-full object-contain"
                    loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center bg-white/90 text-brown-900 sm:hidden"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>

          {n > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Média précédent"
                className="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center bg-white/85 text-brown-900 disabled:opacity-0 sm:flex"
              >
                <ChevronRightIcon className="size-5 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === n - 1}
                aria-label="Média suivant"
                className="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center bg-white/85 text-brown-900 disabled:opacity-0 sm:flex"
              >
                <ChevronRightIcon className="size-5" />
              </button>
              <span className="pointer-events-none absolute left-3 top-3 bg-ink-900/70 px-2 py-0.5 text-xs font-medium text-white">
                {index + 1} / {n}
              </span>
            </>
          )}
        </div>

        {/* Infos */}
        <div className="relative flex flex-col p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 hidden size-11 items-center justify-center text-brown-900 sm:flex"
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
          <h3 id="realisation-title" className="pr-10 font-serif text-2xl leading-tight text-brown-900">
            {r.title}
          </h3>
          {subtitleOf(r) && (
            <p className="mt-1 text-sm text-brown-700">{subtitleOf(r)}</p>
          )}
          <div className="mt-3 h-px w-12 bg-gold-400" aria-hidden />
          {current?.caption && <p className="mt-3 text-ink-900">{current.caption}</p>}

          {/* Miniatures */}
          {n > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none">
              {r.media.map((m, i) => (
                <button
                  key={m._key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Média ${i + 1}`}
                  aria-current={i === index}
                  className={`relative size-14 shrink-0 overflow-hidden border-2 ${i === index ? 'border-brown-900' : 'border-transparent opacity-70'}`}
                >
                  <SanityImage image={coverOf(m)} alt="" aspect={1} sizes="56px" className="size-full object-cover" />
                  {m._type === 'realisationVideo' && (
                    <PlayIcon className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          )}

          {(patterns.length > 0 || products.length > 0) && (
            <div className="mt-6">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-brown-700">
                {r.kind === 'inspiration' ? 'Ce rendu avec nos produits' : 'Produits utilisés'}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {patterns.map((p) => (
                  <LinkedItem
                    key={p._id}
                    href={patternHref(p.categorySlug!, p.productSlug!, p.code!)}
                    image={p.image}
                    title={p.code!}
                    subtitle={p.name}
                    isCode
                  />
                ))}
                {products.map((p) => (
                  <LinkedItem key={p._id} href={`/${p.categorySlug}/${p.slug}`} image={p.image} title={p.title ?? ''} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}

function LinkedItem({
  href,
  image,
  title,
  subtitle,
  isCode = false,
}: {
  href: string
  image: SanityImageData | null
  title: string
  subtitle?: string | null
  isCode?: boolean
}) {
  return (
    <li>
      <Link href={href} className="flex min-h-14 items-center gap-3 border border-gold-200 p-1.5 pr-3 transition hover:border-gold-400">
        <SanityImage image={image} alt="" aspect={1} sizes="48px" className="size-12 shrink-0 object-cover" />
        <span className="min-w-0 flex-1">
          <span className={isCode ? 'pattern-code block text-brown-900' : 'block font-semibold text-brown-900'}>{title}</span>
          {subtitle && <span className="block truncate text-sm text-brown-700">{subtitle}</span>}
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-brown-700" />
      </Link>
    </li>
  )
}
