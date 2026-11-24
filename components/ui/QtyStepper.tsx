'use client'

import { MinusIcon, PlusIcon } from './icons'

interface Props {
  value: number
  onChange: (qty: number) => void
  min?: number
  max?: number
  label?: string
}

/** Sélecteur de quantité avec cibles tactiles de 44 px. */
export function QtyStepper({ value, onChange, min = 1, max = 999, label = 'Quantité' }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, Math.floor(n) || min)))
  return (
    <div className="inline-flex items-center border border-gold-200 bg-white" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={value <= min}
        className="flex size-11 items-center justify-center text-brown-900 disabled:opacity-30"
        aria-label="Diminuer"
      >
        <MinusIcon className="size-5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-12 border-x border-gold-200 bg-transparent py-2 text-center font-semibold text-ink-900 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={value >= max}
        className="flex size-11 items-center justify-center text-brown-900 disabled:opacity-30"
        aria-label="Augmenter"
      >
        <PlusIcon className="size-5" />
      </button>
    </div>
  )
}
