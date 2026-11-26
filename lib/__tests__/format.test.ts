import { describe, expect, it } from 'vitest'
import { formatBeninPhone, normalizeCode } from '../format'
import { mapHref } from '../routes'

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

describe('mapHref', () => {
  it('garde un vrai lien Google Maps', () => {
    expect(mapHref('https://maps.app.goo.gl/abc123', 'Revêt & Déco', null)).toBe('https://maps.app.goo.gl/abc123')
  })
  it('remplace un lien de recherche Google par une recherche Maps', () => {
    const url = mapHref('https://share.google/W4nfuykpACfizRpL9', 'Revêt & Déco', 'Godomey')!
    expect(url.startsWith('https://www.google.com/maps/search/?api=1&query=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('Revêt & Déco, Godomey')
  })
  it('rien sans lien ni adresse', () => {
    expect(mapHref(null, 'Revêt & Déco', null)).toBeNull()
  })
})
