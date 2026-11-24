import type { Catalog } from '../types'

export const catalog: Catalog = {
  products: {
    'product-ppa': {
      id: 'product-ppa',
      title: 'Papier peint autocollant',
      unit: 'rouleau',
      hasPatterns: true,
      priceTiers: [
        { minQty: 1, unitPrice: 2500 },
        { minQty: 6, unitPrice: 2000 },
      ],
    },
    'product-intisse': {
      id: 'product-intisse',
      title: 'Papier peint intissé',
      unit: 'rouleau',
      hasPatterns: true,
      priceTiers: [{ minQty: 1, unitPrice: 4000 }],
    },
    'product-spray-or': {
      id: 'product-spray-or',
      title: 'Spray peinture or',
      unit: 'bombe',
      hasPatterns: false,
      availability: 'disponible',
      priceTiers: [{ minQty: 1, unitPrice: 1500 }],
    },
  },
  patterns: {
    'PP-M12': { code: 'PP-M12', name: 'Marbre blanc & or', productId: 'product-ppa', availability: 'disponible' },
    'PP-L03': { code: 'PP-L03', name: 'Lambris chêne clair', productId: 'product-ppa', availability: 'disponible' },
    'PP-X99': { code: 'PP-X99', name: 'Motif épuisé', productId: 'product-ppa', availability: 'epuise' },
    'IN-F01': {
      code: 'IN-F01',
      name: 'Floral vert',
      productId: 'product-intisse',
      availability: 'sur_commande',
      priceOverride: 7000,
    },
  },
}
