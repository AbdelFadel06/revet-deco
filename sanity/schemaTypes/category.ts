import { FolderIcon } from '@sanity/icons/Folder'
import { defineField, defineType } from 'sanity'
import { advancedGroup, orderField } from './shared'

export const category = defineType({
  name: 'category',
  title: 'Catégorie',
  type: 'document',
  icon: FolderIcon,
  groups: [{ name: 'contenu', title: 'Contenu', default: true }, advancedGroup],
  fields: [
    defineField({ name: 'title', title: 'Nom', type: 'string', group: 'contenu', validation: (r) => r.required() }),
    defineField({
      name: 'navLabel',
      title: 'Nom court dans le menu',
      type: 'string',
      group: 'contenu',
      description: 'Ex. : « Mur » pour « Revêtement mural ». Laisser vide pour utiliser le nom.',
      validation: (r) => r.max(14),
    }),
    defineField({
      name: 'slug',
      title: 'Adresse de la page',
      type: 'slug',
      group: advancedGroup.name,
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3, group: 'contenu' }),
    defineField({ name: 'image', title: 'Image', type: 'image', group: 'contenu', options: { hotspot: true } }),
    defineField({
      name: 'isVisible',
      title: 'Visible sur le site',
      type: 'boolean',
      group: 'contenu',
      initialValue: true,
    }),
    defineField({
      name: 'isSeasonal',
      title: 'Catégorie saisonnière (ex. Noël)',
      type: 'boolean',
      group: 'contenu',
      description: "Mise en avant sur la page d'accueil quand elle est visible.",
      initialValue: false,
    }),
    orderField(),
  ],
  orderings: [{ title: 'Ordre', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', media: 'image', isVisible: 'isVisible', isSeasonal: 'isSeasonal' },
    prepare: ({ title, media, isVisible, isSeasonal }) => ({
      title,
      media,
      subtitle: [isVisible === false ? 'Masquée' : 'Visible', isSeasonal ? 'Saisonnière' : null]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
