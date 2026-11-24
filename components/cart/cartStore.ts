'use client'

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { normalizeCode } from '@/lib/format'
import type { CartItem } from '@/lib/types'

/**
 * Le panier ne stocke QUE productId, patternCode et qty.
 * Les prix sont recalculés avec `getCartTotals()` à partir du catalogue actuel.
 */
interface CartState {
  items: CartItem[]
  add: (item: CartItem) => void
  setQty: (productId: string, patternCode: string | null | undefined, qty: number) => void
  remove: (productId: string, patternCode: string | null | undefined) => void
  clear: () => void
}

const sameLine = (a: CartItem, productId: string, code: string | null) =>
  a.productId === productId && (a.patternCode ?? null) === code

const codeOf = (code: string | null | undefined) => (code ? normalizeCode(code) : null)

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: ({ productId, patternCode, qty }) =>
        set((state) => {
          const code = codeOf(patternCode)
          const n = Math.max(1, Math.floor(qty))
          const existing = state.items.find((i) => sameLine(i, productId, code))
          if (existing) {
            return {
              items: state.items.map((i) => (sameLine(i, productId, code) ? { ...i, qty: i.qty + n } : i)),
            }
          }
          return { items: [...state.items, { productId, patternCode: code, qty: n }] }
        }),
      setQty: (productId, patternCode, qty) =>
        set((state) => {
          const code = codeOf(patternCode)
          const n = Math.floor(qty)
          return {
            items:
              n <= 0
                ? state.items.filter((i) => !sameLine(i, productId, code))
                : state.items.map((i) => (sameLine(i, productId, code) ? { ...i, qty: n } : i)),
          }
        }),
      remove: (productId, patternCode) =>
        set((state) => ({ items: state.items.filter((i) => !sameLine(i, productId, codeOf(patternCode))) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'rd-cart-v1',
      version: 1,
      // Rechargé après le premier rendu par <CartHydrator /> : le serveur et le
      // premier rendu client voient tous deux un panier vide (pas d'erreur d'hydratation).
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      // Ne persister que les données du panier, et filtrer tout ce qui serait corrompu.
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const raw = (persisted as { items?: unknown })?.items
        const items = Array.isArray(raw)
          ? raw.filter(
              (i): i is CartItem =>
                typeof i === 'object' &&
                i !== null &&
                typeof (i as CartItem).productId === 'string' &&
                Number.isInteger((i as CartItem).qty) &&
                (i as CartItem).qty > 0,
            )
          : []
        return { ...current, items }
      },
    },
  ),
)

/**
 * Vrai une fois le panier rechargé depuis le localStorage (voir <CartHydrator />).
 * Évite d'afficher « panier vide » pendant une fraction de seconde.
 */
export function useCartHydrated() {
  return useSyncExternalStore(
    (cb) => useCart.persist.onFinishHydration(cb),
    () => useCart.persist.hasHydrated(),
    () => false,
  )
}
