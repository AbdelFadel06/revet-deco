import { PackageIcon } from '@sanity/icons/Package'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { advancedGroup, availabilityField, orderField, shopmRefField, unitOptions } from './shared'

interface Tier {
  minQty?: number
  unitPrice?: number
}

export const product = defineType({
  name: 'product',
  title: 'Produit',
  type: 'document',
  icon: PackageIcon,
  groups: [
    { name: 'contenu', title: 'Contenu', default: true },
    { name: 'prix', title: 'Prix & unité' },
    { name: 'photos', title: 'Photos' },
    advancedGroup,
  ],
  fields: [
    defineField({ name: 'title', title: 'Nom', type: 'string', group: 'contenu', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Adresse de la page',
      type: 'slug',
      group: advancedGroup.name,
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'contenu',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'shortDescription', title: 'Description courte', type: 'text', rows: 2, group: 'contenu' }),
    defineField({
      name: 'features',
      title: 'Caractéristiques',
      type: 'array',
      group: 'contenu',
      description:
        'Courtes étiquettes affichées sur le produit et sur chaque motif. Ex. : « 5 m × 60 cm », « Autocollant », « Imperméable ».',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      group: 'contenu',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({
      name: 'hasPatterns',
      title: 'Ce produit existe en plusieurs motifs',
      type: 'boolean',
      group: 'contenu',
      description: 'Papier peint, feuilles marbrées, panneaux 3D… Les motifs se gèrent dans « Motifs ».',
      initialValue: false,
    }),
    {
      ...availabilityField('Uniquement pour les produits sans motifs.'),
      group: 'contenu',
      hidden: ({ document }) => Boolean(document?.hasPatterns),
    },
    defineField({
      name: 'installTips',
      title: 'Conseils de pose',
      type: 'array',
      group: 'contenu',
      of: [defineArrayMember({ type: 'block' })],
    }),
    defineField({ name: 'isFeatured', title: "Mettre en avant sur l'accueil", type: 'boolean', group: 'contenu', initialValue: false }),

    // --- Prix & unité
    defineField({
      name: 'unit',
      title: 'Unité de vente',
      type: 'string',
      group: 'prix',
      options: { list: unitOptions },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'dimensions', title: 'Dimensions', type: 'string', group: 'prix', description: 'Ex. : 5 m × 60 cm' }),
    defineField({
      name: 'priceTiers',
      title: 'Prix (paliers)',
      type: 'array',
      group: 'prix',
      description:
        'Premier palier : à partir de 1. Ajoutez un palier pour un prix réduit à partir d’une quantité (ex. 2 000 F dès 6).',
      of: [defineArrayMember({ type: 'priceTier' })],
      validation: (r) =>
        r.required().min(1).custom((tiers: Tier[] | undefined) => {
          if (!tiers?.length) return true
          if (tiers[0].minQty !== 1) return 'Le premier palier doit commencer à 1.'
          for (let i = 1; i < tiers.length; i++) {
            if ((tiers[i].minQty ?? 0) <= (tiers[i - 1].minQty ?? 0))
              return 'Les paliers doivent être triés par quantité croissante.'
          }
          return true
        }),
    }),
    defineField({
      name: 'priceRange',
      title: 'Fourchette de prix affichée',
      type: 'object',
      group: 'prix',
      description: 'Optionnel. Pour afficher « 4 000 – 7 000 F » quand le prix varie selon le motif.',
      fields: [
        defineField({ name: 'min', title: 'Minimum (F)', type: 'number' }),
        defineField({ name: 'max', title: 'Maximum (F)', type: 'number' }),
      ],
      options: { columns: 2 },
    }),
    defineField({
      name: 'coveragePerUnit',
      title: 'Surface couverte par unité (m²)',
      type: 'number',
      group: 'prix',
      description: 'Active le calculateur de quantité. Papier peint autocollant : 3.',
      validation: (r) => r.positive(),
    }),

    // --- Photos
    defineField({ name: 'mainImage', title: 'Photo principale', type: 'image', group: 'photos', options: { hotspot: true } }),
    defineField({
      name: 'gallery',
      title: 'Galerie (photos posées, avant / après)',
      type: 'array',
      group: 'photos',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'caption', title: 'Légende', type: 'string' })],
        }),
      ],
    }),

    // --- Avancé
    defineField({
      name: 'wasteMargin',
      title: 'Marge de perte (calculateur)',
      type: 'number',
      group: advancedGroup.name,
      description: 'Laisser vide pour utiliser la valeur des réglages (10 %). 0,15 = 15 %.',
      validation: (r) => r.min(0).max(0.5),
    }),
    orderField(),
    shopmRefField(),
  ],
  orderings: [{ title: 'Ordre', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', category: 'category.title', media: 'mainImage', price: 'priceTiers.0.unitPrice' },
    prepare: ({ title, category, media, price }) => ({
      title,
      media,
      subtitle: [category, price ? `${new Intl.NumberFormat('fr-FR').format(price)} F` : null].filter(Boolean).join(' · '),
    }),
  },
})

export const priceTier = defineType({
  name: 'priceTier',
  title: 'Palier de prix',
  type: 'object',
  fields: [
    defineField({ name: 'minQty', title: 'À partir de (quantité)', type: 'number', initialValue: 1, validation: (r) => r.required().integer().min(1) }),
    defineField({ name: 'unitPrice', title: 'Prix unitaire (F)', type: 'number', validation: (r) => r.required().min(0) }),
  ],
  preview: {
    select: { minQty: 'minQty', unitPrice: 'unitPrice' },
    prepare: ({ minQty, unitPrice }) => ({
      title: `${new Intl.NumberFormat('fr-FR').format(unitPrice ?? 0)} F l’unité`,
      subtitle: minQty === 1 ? 'Prix de base' : `Dès ${minQty}`,
    }),
  },
})
