'use client'

import { Children, useState, type ReactNode } from 'react'

/**
 * Grille qui affiche d'abord `initial` éléments, puis `step` de plus à chaque
 * « Voir plus ». Les éléments sont rendus côté serveur et passés en enfants.
 * Garder `initial` et `step` pairs pour des rangées complètes sur mobile (2 colonnes).
 */
export function ExpandableGrid({
  children,
  initial = 4,
  step = 4,
  className,
  label = 'Voir plus',
}: {
  children: ReactNode
  initial?: number
  step?: number
  className?: string
  label?: string
}) {
  const items = Children.toArray(children)
  const [visible, setVisible] = useState(initial)
  const remaining = items.length - visible

  return (
    <>
      <div className={className}>{items.slice(0, visible)}</div>
      {remaining > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + step)}
            className="inline-flex min-h-11 items-center border border-brown-900 px-6 text-sm font-semibold text-brown-900 transition hover:bg-brown-900 hover:text-gold-200"
          >
            {label}
          </button>
        </div>
      )}
    </>
  )
}
