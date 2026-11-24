/** Marge de perte par défaut (10 %), surchargeable par produit ou siteSettings. */
export const DEFAULT_WASTE_MARGIN = 0.1

/**
 * Nombre d'unités nécessaires pour couvrir une surface.
 * unités = ceil( surface × (1 + marge) / couverture )
 */
export function unitsNeeded(surface: number, coverage: number, margin = DEFAULT_WASTE_MARGIN): number {
  if (!(surface > 0) || !(coverage > 0)) return 0
  const raw = (surface * (1 + Math.max(0, margin))) / coverage
  // Arrondi à 1e-9 pour éviter 3.0000000004 → 4 à cause des flottants.
  return Math.ceil(Math.round(raw * 1e9) / 1e9)
}

/** Surface d'un mur (m²) moins les ouvertures (portes, fenêtres). */
export function wallSurface(
  width: number,
  height: number,
  openings: { width: number; height: number }[] = [],
): number {
  const gross = Math.max(0, width) * Math.max(0, height)
  const holes = openings.reduce((s, o) => s + Math.max(0, o.width) * Math.max(0, o.height), 0)
  return Math.max(0, gross - holes)
}

/** Surface d'un sol ou d'un plafond (m²). */
export function floorSurface(length: number, width: number): number {
  return Math.max(0, length) * Math.max(0, width)
}
