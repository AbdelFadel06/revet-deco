import { defineField } from 'sanity'

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
