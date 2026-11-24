'use client'

/**
 * Configuration du Sanity Studio, monté sur /studio.
 */
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { SetAvailabilityAction } from './sanity/actions/setAvailability'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schemaTypes, singletonTypes } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  title: 'Revêt & Déco',
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Pas de « Créer un nouveau » pour les singletons.
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (prev, { schemaType }) => {
      if (singletonTypes.has(schemaType)) {
        return prev.filter(({ action }) => action && ['publish', 'discardChanges', 'restore'].includes(action))
      }
      if (schemaType === 'pattern') return [SetAvailabilityAction, ...prev]
      return prev
    },
  },
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion, title: 'Requêtes (GROQ)' })],
})
