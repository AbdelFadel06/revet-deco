'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/components/cart/cartStore'
import { CartIcon } from '@/components/ui/icons'
import { getPreviousPath } from './NavigationTracker'

/**
 * Icône panier avec compteur. `light` sur photo, `gold` sur fond brun.
 * Sur la page panier, l'icône sert à en sortir : retour à la page précédente
 * (ou à l'accueil si l'on est arrivé directement sur le panier).
 */
export function CartButton({ tone = 'gold' }: { tone?: 'gold' | 'light' }) {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0))
  const pathname = usePathname()
  const router = useRouter()
  const onCart = pathname === '/panier'

  const label = onCart
    ? 'Quitter le panier'
    : count > 0
      ? `Panier : ${count} article${count > 1 ? 's' : ''}`
      : 'Panier'

  return (
    <Link
      href={onCart ? '/' : '/panier'}
      onClick={(e) => {
        if (!onCart) return
        e.preventDefault()
        // Venu d'une autre page du site : retour arrière (filtres et position conservés).
        // Arrivé directement sur le panier (lien partagé, nouvel onglet) : accueil.
        if (getPreviousPath()) router.back()
        else router.push('/')
      }}
      aria-label={label}
      title={label}
      aria-current={onCart ? 'page' : undefined}
      className={`relative flex size-11 items-center justify-center transition ${
        tone === 'light' ? 'text-white hover:bg-white/15' : 'text-gold-400 hover:bg-white/5'
      } ${onCart ? 'bg-white/10' : ''}`}
    >
      <CartIcon />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold-400 px-1 text-xs font-semibold text-brown-900">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
