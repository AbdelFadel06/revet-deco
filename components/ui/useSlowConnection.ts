'use client'

import { useSyncExternalStore } from 'react'

/** API « Network Information » (Chrome / Android ; absente sur Safari iOS). */
interface NetworkInformation extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
  saveData?: boolean
}

const connection = (): NetworkInformation | undefined =>
  typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { connection?: NetworkInformation }).connection

/**
 * Vrai si la connexion est lente (2G/3G) ou si l'« économiseur de données »
 * est activé. Côté serveur et quand l'information n'existe pas : faux
 * (comportement normal).
 */
export function isSlowConnection(): boolean {
  const c = connection()
  if (!c) return false
  return Boolean(c.saveData) || c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || c.effectiveType === '3g'
}

export function useSlowConnection(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const c = connection()
      c?.addEventListener('change', cb)
      return () => c?.removeEventListener('change', cb)
    },
    isSlowConnection,
    () => false,
  )
}
