'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { normalizeCode } from '@/lib/format'

export { patternHref } from '@/lib/routes'

/**
 * Fenêtre du motif dont l'adresse est celle de sa vraie page :
 * - ouvrir : `pushState` vers /categorie/produit/CODE (sans recharger) ;
 *   les paramètres de filtre sont conservés pour la grille en dessous ;
 * - fermer : retour arrière (filtres et position de défilement intacts) ;
 * - ouvrir cette adresse directement (lien partagé, Google, rechargement)
 *   affiche la page dédiée du motif, rendue par le serveur.
 * Les anciens liens en #CODE ouvrent aussi la fenêtre.
 */
export function usePatternRoute(codes: readonly string[], hrefOf: (code: string) => string, gridPath: string) {
  const pathname = usePathname()
  const pushedRef = useRef(false)
  const closingRef = useRef(false)

  // Le motif ouvert est lu dans l'adresse : /categorie/produit/CODE.
  const segments = pathname.split('/').filter(Boolean)
  const candidate = segments.length === 3 ? normalizeCode(decodeURIComponent(segments[2])) : null
  const selectedCode = candidate && codes.includes(candidate) ? candidate : null

  const open = useCallback(
    (code: string) => {
      closingRef.current = false
      pushedRef.current = true
      window.history.pushState(null, '', hrefOf(code) + window.location.search)
    },
    [hrefOf],
  )

  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (pushedRef.current) {
      pushedRef.current = false
      window.history.back()
    } else {
      window.history.replaceState(null, '', gridPath + window.location.search)
    }
  }, [gridPath])

  // Anciens liens partagés en #CODE : on les convertit en adresse de motif.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1))
    const code = hash ? normalizeCode(hash) : null
    if (code && codes.includes(code)) {
      window.history.replaceState(null, '', hrefOf(code) + window.location.search)
    }
    // Une seule fois, au chargement de la grille.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Réarme la fermeture quand la fenêtre est refermée par le bouton retour.
  useEffect(() => {
    if (!selectedCode) closingRef.current = false
  }, [selectedCode])

  return { selectedCode, open, close }
}
