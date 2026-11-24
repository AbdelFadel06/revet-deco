'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Mémorise la page précédente visitée DANS le site (navigation côté client),
 * pour qu'un bouton « retour » sache s'il peut revenir en arrière sans quitter
 * le site. (document.referrer n'est pas mis à jour par la navigation Next.js.)
 */
let current: string | null = null
let previous: string | null = null

export function getPreviousPath() {
  return previous
}

export function NavigationTracker() {
  const pathname = usePathname()
  useEffect(() => {
    const path = window.location.pathname + window.location.search + window.location.hash
    if (path !== current) {
      previous = current
      current = path
    }
  }, [pathname])
  return null
}
