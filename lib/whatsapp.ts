import { formatPrice, unitLabel } from './format'
import type { CartProductGroup, CartTotals } from './pricing'
import type { SiteSettingsForOrder } from './types'

/** Format attendu : 229 + numéro béninois à 10 chiffres, sans « + » ni espaces. */
export const WHATSAPP_NUMBER_REGEX = /^229\d{10}$/

/** Au-delà, on abrège le message (noms de motifs retirés, codes conservés). */
export const MESSAGE_SOFT_LIMIT = 1500

type Detail = 'full' | 'codes' | 'compact'

function renderGroup(group: CartProductGroup, detail: Detail): string[] {
  const { product, lines, totalQty, subtotal } = group
  const hasPatterns = lines.some((l) => l.patternCode)
  const onOrder = (l: (typeof lines)[number]) => (l.availability === 'sur_commande' ? ' (sur commande)' : '')

  if (!hasPatterns) {
    const l = lines[0]
    return [`• ${product.title} × ${totalQty}${onOrder(l)} → ${formatPrice(subtotal)}`]
  }

  const out = [`• ${product.title}`]
  const samePrice = lines.every((l) => l.unitPrice === lines[0].unitPrice)

  if (detail === 'compact') {
    out.push('  ' + lines.map((l) => `${l.patternCode} ×${l.qty}${onOrder(l)}`).join(', '))
  } else {
    for (const l of lines) {
      const name = detail === 'full' && l.patternName ? ` (${l.patternName})` : ''
      const price = samePrice ? '' : ` → ${formatPrice(l.lineTotal)}`
      out.push(`  - ${l.patternCode}${name} × ${l.qty}${onOrder(l)}${price}`)
    }
  }

  out.push(
    samePrice
      ? `  → ${totalQty} ${unitLabel(product.unit, totalQty)} × ${formatPrice(lines[0].unitPrice)} = ${formatPrice(subtotal)}`
      : `  → Sous-total : ${formatPrice(subtotal)}`,
  )
  return out
}

function render(totals: CartTotals, settings: SiteSettingsForOrder, detail: Detail): string {
  const parts: string[] = [`Bonjour ${settings.shopName} 👋`, 'Je souhaite commander :', '']
  for (const group of totals.groups) {
    parts.push(...renderGroup(group, detail), '')
  }
  parts.push(
    `Total estimé : ${formatPrice(totals.total)}`,
  )
  // Pas de « Nom / Quartier » : l'équipe les demande plus tard dans la conversation,
  // au moment du paiement et de la livraison (moins de frein à l'envoi).
  return parts.join('\n')
}

/**
 * Construit le message de commande. Si le message dépasse ~1 500 caractères,
 * on retire d'abord les noms de motifs, puis on passe à une liste compacte.
 */
export function buildWhatsAppMessage(
  totals: CartTotals,
  settings: SiteSettingsForOrder,
  { softLimit = MESSAGE_SOFT_LIMIT }: { softLimit?: number } = {},
): string {
  const levels: Detail[] = ['full', 'codes', 'compact']
  let message = ''
  for (const level of levels) {
    message = render(totals, settings, level)
    if (message.length <= softLimit) break
  }
  return message
}

export function buildWhatsAppUrl(number: string, message?: string): string {
  if (!WHATSAPP_NUMBER_REGEX.test(number)) {
    throw new Error(`Numéro WhatsApp invalide : « ${number} » (attendu : 229XXXXXXXXXX)`)
  }
  const base = `https://wa.me/${number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Bouton flottant « Une question ? » : conversation simple, sans panier. */
export function buildQuestionUrl(settings: SiteSettingsForOrder): string {
  return buildWhatsAppUrl(settings.whatsappNumber, `Bonjour ${settings.shopName} 👋 J'ai une question :`)
}
