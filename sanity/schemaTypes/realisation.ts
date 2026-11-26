import { ImagesIcon } from '@sanity/icons/Images'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { VIDEO_MAX_MB, warnHeavyVideo } from './shared'

/**
 * Réalisation de la boutique (chantier client) : avant/après, photos ou
 * courtes vidéos. Affichée sur l'accueil (« Nos dernières réalisations »).
 * Le 1er média est la couverture de la carte.
 */
export const realisation = defineType({
  name: 'realisation',
  title: 'Réalisation',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      description: 'Ex. : Salon en marbre blanc & or',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'place', title: 'Lieu', type: 'string', description: 'Ex. : Cotonou, Fidjrossè (facultatif)' }),
    defineField({
      name: 'date',
      title: 'Date du chantier',
      type: 'date',
      description: 'Les plus récentes s’affichent en premier.',
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'media',
      title: 'Photos et vidéos',
      type: 'array',
      description:
        'Avant / après, photos ou vidéos (5 à 15 s, sans son). Le premier élément sert de couverture ; glissez pour changer l’ordre.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'beforeAfter',
          title: 'Avant / après',
          fields: [
            defineField({ name: 'before', title: 'Avant', type: 'image', options: { hotspot: true }, validation: (r) => r.required() }),
            defineField({ name: 'after', title: 'Après', type: 'image', options: { hotspot: true }, validation: (r) => r.required() }),
            defineField({ name: 'caption', title: 'Légende', type: 'string' }),
          ],
          preview: {
            select: { title: 'caption', media: 'after' },
            prepare: ({ title, media }) => ({ title: title || 'Avant / après', subtitle: 'Avant / après', media }),
          },
        }),
        defineArrayMember({
          type: 'image',
          title: 'Photo',
          options: { hotspot: true },
          fields: [defineField({ name: 'caption', title: 'Légende', type: 'string' })],
        }),
        defineArrayMember({
          type: 'object',
          name: 'realisationVideo',
          title: 'Vidéo',
          fields: [
            defineField({
              name: 'mp4',
              title: 'Vidéo MP4',
              type: 'file',
              options: { accept: 'video/mp4' },
              description: `Courte (5 à 15 s), sans son, moins de ${VIDEO_MAX_MB} Mo. Astuce : envoyez-la-vous d’abord sur WhatsApp, elle sera compressée.`,
              validation: (r) => [r.required(), r.custom(warnHeavyVideo).warning()],
            }),
            defineField({
              name: 'poster',
              title: 'Image d’attente',
              type: 'image',
              description: 'Affichée avant la lecture et sur les connexions lentes.',
              validation: (r) => r.required(),
            }),
            defineField({ name: 'caption', title: 'Légende', type: 'string' }),
          ],
          preview: {
            select: { title: 'caption', media: 'poster' },
            prepare: ({ title, media }) => ({ title: title || 'Vidéo', subtitle: 'Vidéo', media }),
          },
        }),
      ],
      validation: (r) => r.required().min(1).max(12),
    }),
    defineField({
      name: 'patterns',
      title: 'Motifs utilisés',
      type: 'array',
      description: 'Facultatif : le client pourra commander le même motif en un clic.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'pattern' }] })],
    }),
    defineField({
      name: 'isVisible',
      title: 'Afficher sur le site',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [{ title: 'Plus récentes', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', place: 'place', date: 'date', media: 'media.0', after: 'media.0.after', poster: 'media.0.poster' },
    prepare: ({ title, place, date, media, after, poster }) => ({
      title,
      subtitle: [place, date].filter(Boolean).join(' · '),
      media: after ?? poster ?? media,
    }),
  },
})
