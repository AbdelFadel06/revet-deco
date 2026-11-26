import { ImageIcon } from '@sanity/icons/Image'
import { defineArrayMember, defineField, defineType, type ValidationContext } from 'sanity'
import { apiVersion } from '../env'
import { advancedGroup, availabilityField, availabilityLabels, shopmRefField } from './shared'

const AVAILABILITY_EMOJI: Record<string, string> = { disponible: '🟢', sur_commande: '🟠', epuise: '⚫' }

async function isCodeUnique(code: string | undefined, context: ValidationContext) {
  if (!code || !context.document) return true
  const id = context.document._id.replace(/^drafts\./, '')
  const client = context.getClient({ apiVersion })
  const existing = await client.fetch<string | null>(
    `*[_type == "pattern" && code == $code && !(_id in [$id, $draft])][0]._id`,
    { code, id, draft: `drafts.${id}` },
  )
  return existing ? `Le code « ${code} » est déjà utilisé par un autre motif.` : true
}

export const pattern = defineType({
  name: 'pattern',
  title: 'Motif',
  type: 'document',
  icon: ImageIcon,
  groups: [{ name: 'contenu', title: 'Contenu', default: true }, advancedGroup],
  fields: [
    defineField({
      name: 'code',
      title: 'Code motif',
      type: 'string',
      group: 'contenu',
      description: 'Code unique utilisé en boutique, en MAJUSCULES. Ex. : PP-M12',
      validation: (r) =>
        r
          .required()
          .custom((code: string | undefined) =>
            code && code !== code.toUpperCase().trim() ? 'Le code doit être en majuscules, sans espaces autour.' : true,
          )
          .custom((code: string | undefined, context) => isCodeUnique(code, context)),
    }),
    defineField({ name: 'name', title: 'Nom', type: 'string', group: 'contenu', description: 'Ex. : Marbre blanc & or', validation: (r) => r.required() }),
    defineField({
      name: 'product',
      title: 'Produit',
      type: 'reference',
      to: [{ type: 'product' }],
      group: 'contenu',
      options: { filter: 'hasPatterns == true' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'family',
      title: 'Famille',
      type: 'reference',
      to: [{ type: 'patternFamily' }],
      group: 'contenu',
      options: {
        filter: ({ document }) => {
          const productRef = (document as { product?: { _ref?: string } }).product?._ref
          return productRef
            ? { filter: 'product._ref == $p', params: { p: productRef } }
            : { filter: 'true' }
        },
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      group: 'contenu',
      description:
        'Glissez une ou plusieurs photos. La 1re est la photo principale (grilles, panier). Changez l’ordre avec la poignée ⋮⋮.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'caption', title: 'Légende (facultatif)', type: 'string' }),
            defineField({
              name: 'isRender',
              title: 'Image de simulation',
              type: 'boolean',
              description: 'Cochée automatiquement pour les rendus générés. Affiche « Simulation indicative » sur le site.',
              initialValue: false,
            }),
          ],
        }),
      ],
      options: { layout: 'grid' },
      validation: (r) => r.required().min(1).error('Ajoutez au moins une photo du motif.'),
    }),
    // Anciens champs (avant « Photos ») : masqués, conservés le temps de la migration.
    defineField({ name: 'image', title: 'Ancienne photo à plat', type: 'image', group: 'avance', hidden: true }),
    defineField({ name: 'roomImage', title: 'Ancienne photo posée', type: 'image', group: 'avance', hidden: true }),
    { ...availabilityField(), group: 'contenu' },
    defineField({
      name: 'priceOverride',
      title: 'Prix spécifique (F)',
      type: 'number',
      group: 'contenu',
      description: 'Laisser vide pour utiliser le prix du produit. Utile pour l’intissé.',
      validation: (r) => r.min(0),
    }),
    defineField({ name: 'isFeatured', title: 'Mettre en avant', type: 'boolean', group: 'contenu', initialValue: false }),
    shopmRefField(),
  ],
  orderings: [{ title: 'Code', name: 'code', by: [{ field: 'code', direction: 'asc' }] }],
  preview: {
    select: { code: 'code', name: 'name', media: 'photos.0', availability: 'availability' },
    prepare: ({ code, name, media, availability }) => ({
      title: `${code ?? '—'} — ${name ?? ''}`,
      subtitle: `${AVAILABILITY_EMOJI[availability] ?? ''} ${availabilityLabels[availability] ?? ''}`,
      media,
    }),
  },
})
