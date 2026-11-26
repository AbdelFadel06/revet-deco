import { defineField, type ValidationContext } from 'sanity'
import { apiVersion } from '../env'

export const availabilityOptions = [
  { title: '✅ Disponible', value: 'disponible' },
  { title: '🕒 Sur commande', value: 'sur_commande' },
  { title: '⛔ Épuisé', value: 'epuise' },
]

export const availabilityLabels: Record<string, string> = {
  disponible: 'Disponible',
  sur_commande: 'Sur commande',
  epuise: 'Épuisé',
}

export const unitOptions = [
  { title: 'Rouleau', value: 'rouleau' },
  { title: 'm²', value: 'm2' },
  { title: 'Paquet', value: 'paquet' },
  { title: 'Pièce', value: 'piece' },
  { title: 'Feuille', value: 'feuille' },
  { title: 'Bombe', value: 'bombe' },
  { title: 'Mètre', value: 'metre' },
]

export const advancedGroup = { name: 'avance', title: 'Avancé' }

export function availabilityField(description?: string) {
  return defineField({
    name: 'availability',
    title: 'Disponibilité',
    type: 'string',
    description,
    options: { list: availabilityOptions, layout: 'radio', direction: 'horizontal' },
    initialValue: 'disponible',
    validation: (r) => r.required(),
  })
}

export function shopmRefField() {
  return defineField({
    name: 'shopmRef',
    title: 'Référence Shopm',
    type: 'string',
    description: "Identifiant de l'article dans Shopm (synchronisation future).",
    group: advancedGroup.name,
  })
}

export function orderField() {
  return defineField({
    name: 'order',
    title: "Ordre d'affichage",
    type: 'number',
    description: 'Les plus petits nombres apparaissent en premier.',
    group: advancedGroup.name,
  })
}

/** Taille au-delà de laquelle une vidéo est signalée comme trop lourde. */
export const VIDEO_MAX_MB = 8

/**
 * Avertissement (non bloquant) si la vidéo dépasse VIDEO_MAX_MB : Sanity ne
 * compresse pas les vidéos, elles sont servies telles quelles aux visiteurs.
 */
export async function warnHeavyVideo(value: { asset?: { _ref?: string } } | undefined, context: ValidationContext) {
  const ref = value?.asset?._ref
  if (!ref) return true
  const size = await context.getClient({ apiVersion }).fetch<number | null>(`*[_id == $ref][0].size`, { ref })
  if (!size || size <= VIDEO_MAX_MB * 1024 * 1024) return true
  const mb = (size / 1024 / 1024).toFixed(1).replace('.', ',')
  return `Vidéo lourde (${mb} Mo, conseillé : moins de ${VIDEO_MAX_MB} Mo) : elle sera lente à charger sur téléphone. Envoyez-la-vous sur WhatsApp ou compressez-la (app « Video Compressor », export 720p de CapCut), puis remplacez-la.`
}
