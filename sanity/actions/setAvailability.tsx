'use client'

import { Button, Stack, Text } from '@sanity/ui'
import { useState } from 'react'
import { type DocumentActionComponent, useDocumentOperation } from 'sanity'
import { availabilityOptions } from '../schemaTypes/shared'

/**
 * Action rapide « Disponibilité » sur un motif : choisir l'état et publier
 * en un clic, sans ouvrir le formulaire.
 */
export const SetAvailabilityAction: DocumentActionComponent = (props) => {
  const { id, type, draft, published, onComplete } = props
  const { patch, publish } = useDocumentOperation(id, type)
  const [open, setOpen] = useState(false)
  const current = (draft ?? published)?.availability as string | undefined

  const choose = (value: string) => {
    patch.execute([{ set: { availability: value } }])
    // On publie immédiatement : le changement est visible sur le site.
    publish.execute()
    setOpen(false)
    onComplete()
  }

  return {
    label: 'Disponibilité',
    tone: 'primary',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'popover',
      onClose: () => setOpen(false),
      content: (
        <Stack gap={2} padding={1}>
          <Text size={1} muted>
            Changer la disponibilité
          </Text>
          {availabilityOptions.map((opt) => (
            <Button
              key={opt.value}
              text={opt.title}
              mode={opt.value === current ? 'default' : 'ghost'}
              onClick={() => choose(opt.value)}
            />
          ))}
        </Stack>
      ),
    },
  }
}
