/**
 * Événements d'audience (Plausible ou Umami, selon celui qui sera installé).
 * Sans outil installé, l'appel ne fait rien.
 */
type Props = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void
    umami?: { track: (event: string, data?: Props) => void }
  }
}

export function track(event: string, props?: Props) {
  if (typeof window === 'undefined') return
  try {
    window.plausible?.(event, props ? { props } : undefined)
    window.umami?.track(event, props)
  } catch {
    // L'analytics ne doit jamais bloquer une commande.
  }
}
