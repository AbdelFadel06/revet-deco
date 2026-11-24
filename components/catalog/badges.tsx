import type { Availability } from '@/lib/types'

/** Badge de disponibilité. « Disponible » reste discret (pas de badge). */
export function AvailabilityBadge({ availability, className = '' }: { availability: Availability | string | null; className?: string }) {
  if (availability === 'sur_commande') {
    return (
      <span className={`inline-flex items-center bg-status-warn px-2 py-0.5 text-xs font-medium text-white ${className}`}>
        Sur commande
      </span>
    )
  }
  if (availability === 'epuise') {
    return (
      <span className={`inline-flex items-center bg-status-out px-2 py-0.5 text-xs font-medium text-white ${className}`}>
        Épuisé
      </span>
    )
  }
  return null
}

/** Étiquettes de caractéristiques (« 5 m × 60 cm », « Autocollant »…). */
export function FeatureChips({ features, max, tone = 'light' }: { features: string[]; max?: number; tone?: 'light' | 'dark' }) {
  const list = max ? features.slice(0, max) : features
  if (list.length === 0) return null
  const style =
    tone === 'dark' ? 'border-gold-400/50 text-gold-200' : 'border-gold-200 bg-white text-brown-900'
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Caractéristiques">
      {list.map((f) => (
        <li key={f} className={`border px-2.5 py-0.5 text-xs ${style}`}>
          {f}
        </li>
      ))}
    </ul>
  )
}
