import { describe, expect, it } from 'vitest'
import { getCartTotals } from '../pricing'
import { buildQuestionUrl, buildWhatsAppMessage, buildWhatsAppUrl } from '../whatsapp'
import type { Catalog } from '../types'
import { catalog } from './fixtures'

const settings = { shopName: 'Revêt & Déco', whatsappNumber: '2290100000000' }
/** Intl fr-FR utilise une espace fine insécable : on normalise pour comparer. */
const norm = (s: string) => s.replace(/[  ]/g, ' ')

describe('buildWhatsAppMessage', () => {
  it("reproduit l'exemple du cahier des charges", () => {
    const totals = getCartTotals(
      [
        { productId: 'product-ppa', patternCode: 'PP-M12', qty: 4 },
        { productId: 'product-ppa', patternCode: 'PP-L03', qty: 2 },
        { productId: 'product-spray-or', qty: 2 },
      ],
      catalog,
    )
    expect(norm(buildWhatsAppMessage(totals, settings))).toBe(
      [
        'Bonjour Revêt & Déco 👋',
        'Je souhaite commander :',
        '',
        '• Papier peint autocollant',
        '  - PP-M12 (Marbre blanc & or) × 4',
        '  - PP-L03 (Lambris chêne clair) × 2',
        '  → 6 rouleaux × 2 000 F = 12 000 F',
        '',
        '• Spray peinture or × 2 → 3 000 F',
        '',
        'Total estimé : 15 000 F',
      ].join('\n'),
    )
  })

  it('ne demande ni nom ni quartier (demandés plus tard par l’équipe)', () => {
    const totals = getCartTotals([{ productId: 'product-spray-or', qty: 1 }], catalog)
    const msg = buildWhatsAppMessage(totals, settings)
    expect(msg).not.toContain('Nom :')
    expect(msg).not.toContain('Quartier')
  })

  it('signale les motifs sur commande', () => {
    const totals = getCartTotals([{ productId: 'product-intisse', patternCode: 'IN-F01', qty: 1 }], catalog)
    expect(buildWhatsAppMessage(totals, settings)).toContain('IN-F01 (Floral vert) × 1 (sur commande)')
  })

  it('abrège un panier long en gardant tous les codes', () => {
    const big: Catalog = { products: catalog.products, patterns: {} }
    const cart = Array.from({ length: 60 }, (_, i) => {
      const code = `PP-Z${String(i).padStart(2, '0')}`
      big.patterns[code] = {
        code,
        name: 'Un nom de motif assez long pour dépasser',
        productId: 'product-ppa',
        availability: 'disponible' as const,
      }
      return { productId: 'product-ppa', patternCode: code, qty: 1 }
    })
    const msg = buildWhatsAppMessage(getCartTotals(cart, big), settings)
    expect(msg).not.toContain('Un nom de motif')
    for (const item of cart) expect(msg).toContain(item.patternCode)
    expect(msg).toContain('Total estimé')
  })
})

describe('buildWhatsAppUrl', () => {
  it('encode le message', () => {
    expect(buildWhatsAppUrl('2290100000000', 'Bonjour & merci')).toBe(
      'https://wa.me/2290100000000?text=Bonjour%20%26%20merci',
    )
  })
  it('refuse un numéro mal formaté', () => {
    expect(() => buildWhatsAppUrl('+229 01 00 00 00 00')).toThrow()
    expect(() => buildWhatsAppUrl('22997000000')).toThrow()
  })
  it('lien « Une question ? » sans panier', () => {
    expect(buildQuestionUrl(settings)).toMatch(/^https:\/\/wa\.me\/2290100000000\?text=Bonjour/)
  })
})
