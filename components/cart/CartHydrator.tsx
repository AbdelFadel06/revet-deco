'use client'

import { useEffect } from 'react'
import { useCart } from './cartStore'

/** Recharge le panier depuis le localStorage, une fois, côté navigateur. */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate()
  }, [])
  return null
}
