import { TagsIcon } from '@sanity/icons/Tags'
import { defineField, defineType } from 'sanity'
import { apiVersion } from '../env'
import { advancedGroup, orderField } from './shared'

export const patternFamily = defineType({
  name: 'patternFamily',
  title: 'Famille de motifs',
  type: 'document',
  icon: TagsIcon,
  groups: [{ name: 'contenu', title: 'Contenu', default: true }, advancedGroup],
  fields: [
    defineField({ name: 'title', title: 'Nom', type: 'string', group: 'contenu', description: 'Ex. : Marbre, Lambris, Floral…', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Adresse de la page',
      type: 'slug',
      group: advancedGroup.name,
      options: {
        source: 'title',
        // Unique par produit : « marbre » peut exister pour le papier peint ET les feuilles marbrées.
        isUnique: async (slug, context) => {
          const doc = context.document as { _id: string; product?: { _ref?: string } } | undefined
          if (!doc?.product?._ref) return true
          const id = doc._id.replace(/^drafts\./, '')
          const count = await context.getClient({ apiVersion }).fetch<number>(
            `count(*[_type == "patternFamily" && slug.current == $slug && product._ref == $product && !(_id in [$id, $draft])])`,
            { slug, product: doc.product._ref, id, draft: `drafts.${id}` },
          )
          return count === 0
        },
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'product',
      title: 'Produit',
      type: 'reference',
      to: [{ type: 'product' }],
      group: 'contenu',
      options: { filter: 'hasPatterns == true' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'coverImage', title: 'Photo de couverture', type: 'image', group: 'contenu', options: { hotspot: true } }),
    orderField(),
  ],
  orderings: [{ title: 'Ordre', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', product: 'product.title', media: 'coverImage' },
    prepare: ({ title, product, media }) => ({ title, subtitle: product, media }),
  },
})
