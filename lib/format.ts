import type { Unit } from './types'

const priceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/** 12000 → « 12 000 F » */
export function formatPrice(amount: number): string {
  return `${priceFormatter.format(Math.round(amount))} F`
}

const UNIT_LABELS: Record<Unit, { one: string; many: string }> = {
  rouleau: { one: 'rouleau', many: 'rouleaux' },
  m2: { one: 'm²', many: 'm²' },
  paquet: { one: 'paquet', many: 'paquets' },
  piece: { one: 'pièce', many: 'pièces' },
  feuille: { one: 'feuille', many: 'feuilles' },
  bombe: { one: 'bombe', many: 'bombes' },
  metre: { one: 'mètre', many: 'mètres' },
}

/** (6, 'rouleau') → « rouleaux » */
export function unitLabel(unit: Unit, qty: number): string {
  const labels = UNIT_LABELS[unit]
  return qty > 1 ? labels.many : labels.one
}

/** Normalise une saisie de code motif : « pp-m12 » → « PP-M12 ». */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Numéro béninois au format WhatsApp (229 + 10 chiffres) → affichage lisible.
 * « 2290197843424 » → « 01 97 84 34 24 ». Renvoie l'entrée telle quelle sinon.
 */
export function formatBeninPhone(international: string): string {
  const m = /^229(\d{10})$/.exec(international)
  if (!m) return international
  return m[1].replace(/(\d{2})(?=\d)/g, '$1 ')
}
