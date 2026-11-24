import { CogIcon } from '@sanity/icons/Cog'
import { defineArrayMember, defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Réglages du site',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'boutique', title: 'Boutique', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'avance', title: 'Avancé' },
  ],
  fields: [
    defineField({ name: 'shopName', title: 'Nom de la boutique', type: 'string', group: 'boutique', initialValue: 'Revêt & Déco', validation: (r) => r.required() }),
    defineField({ name: 'tagline', title: 'Slogan', type: 'string', group: 'boutique', initialValue: 'La rénovation à petit budget' }),
    defineField({
      name: 'heroSlides',
      title: 'Carrousel d’accueil',
      type: 'array',
      group: 'boutique',
      description:
        'Photos ou courtes vidéos (5 à 10 s) de vos réalisations. Vidéos : MP4 sans son, de préférence optimisées (voir media-source/encode.sh).',
      of: [
        defineArrayMember({
          type: 'image',
          title: 'Photo',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'caption', title: 'Légende', type: 'string', description: 'Ex. : Pose de papier peint – Cotonou' }),
            defineField({ name: 'alt', title: 'Description pour l’accessibilité', type: 'string' }),
          ],
        }),
        defineArrayMember({
          type: 'object',
          name: 'heroVideo',
          title: 'Vidéo',
          fields: [
            defineField({
              name: 'mp4',
              title: 'Vidéo MP4 (H.264)',
              type: 'file',
              options: { accept: 'video/mp4' },
              description: 'Lue par tous les téléphones. Obligatoire.',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'av1',
              title: 'Vidéo AV1 (optionnelle, plus légère)',
              type: 'file',
              options: { accept: 'video/mp4' },
              description: 'Utilisée automatiquement par les navigateurs récents.',
            }),
            defineField({
              name: 'poster',
              title: 'Image d’attente',
              type: 'image',
              description: 'Affichée pendant le chargement de la vidéo.',
              validation: (r) => r.required(),
            }),
            defineField({ name: 'caption', title: 'Légende', type: 'string' }),
            defineField({ name: 'alt', title: 'Description pour l’accessibilité', type: 'string' }),
          ],
          preview: {
            select: { title: 'caption', media: 'poster' },
            prepare: ({ title, media }) => ({ title: title || 'Vidéo', subtitle: 'Vidéo', media }),
          },
        }),
      ],
      validation: (r) => r.max(8),
    }),
    defineField({
      name: 'whyUsImage',
      title: 'Photo « Pourquoi nous choisir »',
      type: 'image',
      group: 'boutique',
      description: 'Idéalement un poseur de l’équipe sur un chantier. Format portrait conseillé.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Description pour l’accessibilité', type: 'string' })],
    }),
    defineField({
      name: 'announcement',
      title: 'Bandeau d’annonce',
      type: 'object',
      group: 'boutique',
      fields: [
        defineField({ name: 'text', title: 'Texte', type: 'string' }),
        defineField({ name: 'active', title: 'Afficher le bandeau', type: 'boolean', initialValue: false }),
      ],
    }),
    defineField({
      name: 'whatsappNumber',
      title: 'Numéro WhatsApp',
      type: 'string',
      group: 'contact',
      description: '229 suivi des 10 chiffres, sans « + » ni espaces. Ex. : 2290197000000',
      validation: (r) =>
        r.required().regex(/^229\d{10}$/, { name: 'numéro béninois' }).error('Format attendu : 229 + 10 chiffres, sans espaces'),
    }),
    defineField({ name: 'address', title: 'Adresse', type: 'text', rows: 2, group: 'contact' }),
    defineField({ name: 'openingHours', title: 'Horaires', type: 'text', rows: 3, group: 'contact' }),
    defineField({ name: 'mapUrl', title: 'Lien Google Maps', type: 'url', group: 'contact' }),
    defineField({
      name: 'socials',
      title: 'Réseaux sociaux',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok', type: 'url' }),
      ],
    }),
    defineField({
      name: 'defaultWasteMargin',
      title: 'Marge de perte par défaut (calculateur)',
      type: 'number',
      group: 'avance',
      description: '0,10 = 10 %. Ajoutée à la surface pour les chutes.',
      initialValue: 0.1,
      validation: (r) => r.min(0).max(0.5),
    }),
  ],
  preview: { prepare: () => ({ title: 'Réglages du site' }) },
})
