'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * État stocké dans l'URL du navigateur (?param=… et #hash), sans le lire côté
 * serveur : la page reste statique. Côté serveur et au premier rendu, l'URL
 * est considérée vide (pas d'erreur d'hydratation).
 */
const EVENT = 'rd:urlchange'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  window.addEventListener('hashchange', callback)
  window.addEventListener(EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener('hashchange', callback)
    window.removeEventListener(EVENT, callback)
  }
}

const getSnapshot = () => window.location.search + window.location.hash
const getServerSnapshot = () => ''

export function useUrlState() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const hashIndex = snapshot.indexOf('#')
  const search = new URLSearchParams(hashIndex >= 0 ? snapshot.slice(0, hashIndex) : snapshot)
  const hash = hashIndex >= 0 ? decodeURIComponent(snapshot.slice(hashIndex + 1)) : ''

  /** Met à jour l'URL sans recharger ni ajouter d'entrée d'historique. */
  const update = useCallback((changes: { params?: Record<string, string | null>; hash?: string | null }) => {
    const url = new URL(window.location.href)
    for (const [k, v] of Object.entries(changes.params ?? {})) {
      if (v == null) url.searchParams.delete(k)
      else url.searchParams.set(k, v)
    }
    if (changes.hash !== undefined) url.hash = changes.hash ? encodeURIComponent(changes.hash) : ''
    window.history.replaceState(window.history.state, '', url)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return { search, hash, update }
}
