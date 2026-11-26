import type { SchemaTypeDefinition } from 'sanity'
import { category } from './category'
import { pattern } from './pattern'
import { patternFamily } from './patternFamily'
import { priceTier, product } from './product'
import { realisation } from './realisation'
import { siteSettings } from './siteSettings'

export const schemaTypes: SchemaTypeDefinition[] = [siteSettings, category, product, priceTier, patternFamily, pattern, realisation]

/** Types qui n'ont qu'un seul document (pas de « Créer » ni « Dupliquer »). */
export const singletonTypes = new Set(['siteSettings'])
