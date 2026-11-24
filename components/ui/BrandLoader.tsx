/**
 * Loader aux couleurs de la boutique : nom en serif traversé d'un reflet doré,
 * fin filet or qui se remplit, slogan. Animations en CSS (globals.css),
 * coupées si l'utilisateur a demandé à réduire les animations.
 */
export function BrandLoader({
  label = 'Chargement',
  compact = false,
  shopName = 'Revêt & Déco',
}: {
  label?: string
  compact?: boolean
  shopName?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-16' : 'min-h-[65vh] py-20'}`}
    >
      <p className={`rd-shimmer-text font-serif leading-none ${compact ? 'text-3xl' : 'text-4xl sm:text-5xl'}`}>{shopName}</p>
      <div className={`relative mt-5 h-px overflow-hidden bg-gold-200 ${compact ? 'w-28' : 'w-40'}`} aria-hidden>
        <span className="rd-loader-bar absolute inset-y-0 left-0 w-1/3 bg-gold-400" />
      </div>
      {!compact && <p className="mt-4 text-[0.7rem] uppercase tracking-[0.3em] text-brown-700">La rénovation à petit budget</p>}
      <span className="sr-only">{label}…</span>
    </div>
  )
}
