import { describe, expect, it } from 'vitest'
import { getCartTotals, getNextTier, getTierPrice, getUnitPrice } from '../pricing'
import { formatPrice } from '../format'
import { catalog } from './fixtures'

const tiers = catalog.products['product-ppa'].priceTiers

describe('getTierPrice', () => {
  it('applique le premier palier sous le seuil', () => {
    expect(getTierPrice(tiers, 1)).toBe(2500)
    expect(getTierPrice(tiers, 5)).toBe(2500)
  })
  it('applique le palier dès le seuil', () => {
    expect(getTierPrice(tiers, 6)).toBe(2000)
    expect(getTierPrice(tiers, 40)).toBe(2000)
  })
  it('fonctionne avec des paliers non triés', () => {
    expect(getTierPrice([...tiers].reverse(), 6)).toBe(2000)
  })
})

describe('getUnitPrice', () => {
  it('le priceOverride du motif remplace les paliers', () => {
    expect(getUnitPrice({ priceTiers: tiers }, 10, { priceOverride: 6500 })).toBe(6500)
  })
  it('ignore un override null', () => {
    expect(getUnitPrice({ priceTiers: tiers }, 10, { priceOverride: null })).toBe(2000)
  })
})

describe('getNextTier', () => {
  it('indique combien il manque pour le palier suivant', () => {
    expect(getNextTier(tiers, 4)).toEqual({ qtyNeeded: 2, unitPrice: 2000 })
  })
  it('renvoie null au dernier palier', () => {
    expect(getNextTier(tiers, 6)).toBeNull()
  })
})

describe('getCartTotals', () => {
  it('cumule les motifs pour le palier (4 + 2 = 6 rouleaux → 2 000 F)', () => {
    const t = getCartTotals(
      [
        { productId: 'product-ppa', patternCode: 'PP-M12', qty: 4 },
        { productId: 'product-ppa', patternCode: 'pp-l03', qty: 2 },
      ],
      catalog,
    )
    expect(t.total).toBe(12000)
    expect(t.savings).toBe(3000)
    expect(t.itemCount).toBe(6)
    expect(t.groups[0].nextTier).toBeNull()
  })

  it("propose l'incitation sous le palier", () => {
    const t = getCartTotals([{ productId: 'product-ppa', patternCode: 'PP-M12', qty: 4 }], catalog)
    expect(t.total).toBe(10000)
    expect(t.savings).toBe(0)
    expect(t.groups[0].nextTier).toEqual({ qtyNeeded: 2, unitPrice: 2000 })
  })

  it('exclut les motifs épuisés et introuvables', () => {
    const t = getCartTotals(
      [
        { productId: 'product-ppa', patternCode: 'PP-X99', qty: 3 },
        { productId: 'product-ppa', patternCode: 'NOPE', qty: 1 },
        { productId: 'product-inconnu', qty: 1 },
        { productId: 'product-spray-or', qty: 2 },
      ],
      catalog,
    )
    expect(t.total).toBe(3000)
    expect(t.invalidItems.map((i) => i.reason)).toEqual(['epuise', 'introuvable', 'introuvable'])
  })

  it("un motif d'un autre produit est refusé", () => {
    const t = getCartTotals([{ productId: 'product-intisse', patternCode: 'PP-M12', qty: 1 }], catalog)
    expect(t.invalidItems).toHaveLength(1)
  })

  it('les motifs à prix spécifique ne déclenchent pas de palier', () => {
    const t = getCartTotals([{ productId: 'product-intisse', patternCode: 'IN-F01', qty: 3 }], catalog)
    expect(t.total).toBe(21000)
    expect(t.savings).toBe(0)
    expect(t.groups[0].nextTier).toBeNull()
  })
})

describe('formatPrice', () => {
  it('formate en FCFA avec séparateur de milliers', () => {
    expect(formatPrice(12000).replace(/\s/g, ' ')).toBe('12 000 F')
  })
})
