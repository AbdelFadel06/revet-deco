import { describe, expect, it } from 'vitest'
import { evenSlice, getPriceLabel } from '../display'

const norm = (s: string | null) => s?.replace(/[  ]/g, ' ') ?? null

describe('getPriceLabel', () => {
  it('papier peint autocollant : prix de base + palier', () => {
    const l = getPriceLabel({
      unit: 'rouleau',
      priceTiers: [
        { minQty: 6, unitPrice: 2000 },
        { minQty: 1, unitPrice: 2500 },
      ],
    })
    expect(norm(l.main)).toBe('2 500 F')
    expect(l.per).toBe('le rouleau')
    expect(norm(l.tierHint)).toBe('2 000 F dès 6 rouleaux')
  })

  it('intissé : fourchette de prix', () => {
    const l = getPriceLabel({ unit: 'rouleau', priceTiers: [{ minQty: 1, unitPrice: 4000 }], priceRange: { min: 4000, max: 7000 } })
    expect(norm(l.main)).toBe('4 000 – 7 000 F')
    expect(l.tierHint).toBeNull()
  })

  it('sans prix', () => {
    expect(getPriceLabel({ unit: 'piece', priceTiers: [] }).main).toBe('Prix sur demande')
  })
})

describe('evenSlice', () => {
  it('retire le dernier élément si le nombre est impair', () => {
    expect(evenSlice([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4])
    expect(evenSlice([1, 2])).toEqual([1, 2])
    expect(evenSlice([])).toEqual([])
  })
})
