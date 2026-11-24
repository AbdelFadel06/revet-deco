import { describe, expect, it } from 'vitest'
import { floorSurface, unitsNeeded, wallSurface } from '../calculator'

describe('unitsNeeded', () => {
  it('papier peint : mur de 4 × 2,5 m avec 10 % de marge → 4 rouleaux', () => {
    // 10 m² × 1,1 = 11 m² / 3 = 3,67 → 4
    expect(unitsNeeded(10, 3, 0.1)).toBe(4)
  })
  it("n'arrondit pas au-dessus à cause des flottants", () => {
    // 3 × 1,1 / 1,1 = 3 exactement
    expect(unitsNeeded(3, 1.1, 0.1)).toBe(3)
    expect(unitsNeeded(9, 3, 0)).toBe(3)
  })
  it('utilise 10 % par défaut', () => {
    expect(unitsNeeded(30, 3)).toBe(11)
  })
  it('renvoie 0 pour des entrées invalides', () => {
    expect(unitsNeeded(0, 3)).toBe(0)
    expect(unitsNeeded(10, 0)).toBe(0)
    expect(unitsNeeded(Number.NaN, 3)).toBe(0)
  })
})

describe('surfaces', () => {
  it('mur moins les ouvertures', () => {
    expect(wallSurface(4, 2.5, [{ width: 0.9, height: 2 }])).toBeCloseTo(8.2)
  })
  it('ne descend jamais sous 0', () => {
    expect(wallSurface(1, 1, [{ width: 2, height: 2 }])).toBe(0)
  })
  it('sol', () => {
    expect(floorSurface(5, 4)).toBe(20)
  })
})
