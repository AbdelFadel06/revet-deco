'use client'

import { useRef, useState, type PointerEvent } from 'react'
import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'

/**
 * Comparateur avant / après : on fait glisser la poignée (doigt ou souris)
 * pour dévoiler la photo « Avant » par-dessus la photo « Après ».
 * `touch-action: pan-y` : le glissement horizontal déplace la poignée sans
 * faire défiler le carrousel ; le défilement vertical de la page reste possible.
 * Clavier : flèches gauche / droite sur le curseur (accessible).
 */
export function BeforeAfter({
  before,
  after,
  alt,
  sizes,
}: {
  before: SanityImageData | null
  after: SanityImageData | null
  alt: string
  sizes: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)

  const moveTo = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    setPos(Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)))
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    moveTo(e.clientX)
  }

  // Même cadrage pour les deux photos (4:5) : elles se superposent exactement.
  const imgClass = 'absolute inset-0 size-full object-cover'

  return (
    <div
      ref={ref}
      className="relative aspect-4/5 w-full cursor-ew-resize touch-pan-y select-none overflow-hidden bg-ink-900"
      onPointerDown={onPointerDown}
      onPointerMove={(e) => dragging && moveTo(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <SanityImage image={after} alt={`${alt} – après`} aspect={1.25} sizes={sizes} className={imgClass} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <SanityImage image={before} alt={`${alt} – avant`} aspect={1.25} sizes={sizes} className={imgClass} />
      </div>

      <span className="pointer-events-none absolute bottom-3 left-3 bg-ink-900/70 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
        Avant
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 bg-white/90 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brown-900">
        Après
      </span>

      {/* Ligne + poignée */}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-brown-900/80 text-white shadow-lg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
          </svg>
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparer avant et après"
        className="sr-only"
      />
    </div>
  )
}
