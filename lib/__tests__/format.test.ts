import { describe, expect, it } from 'vitest'
import { formatBeninPhone, normalizeCode } from '../format'

describe('formatBeninPhone', () => {
  it('affiche le numéro local par paires', () => {
    expect(formatBeninPhone('2290197843424')).toBe('01 97 84 34 24')
  })
  it('laisse un format inconnu tel quel', () => {
    expect(formatBeninPhone('+33 6 00')).toBe('+33 6 00')
  })
})

describe('normalizeCode', () => {
  it('met en majuscules et retire les espaces', () => {
    expect(normalizeCode(' pp-m 12 ')).toBe('PP-M12')
  })
})
