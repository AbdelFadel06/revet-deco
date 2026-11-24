'use client'

import { usePathname } from 'next/navigation'
import { useCart } from '@/components/cart/cartStore'
import { WhatsAppIcon } from '@/components/ui/icons'

/**
 * Bulle WhatsApp flottante (icône seule, ronde) : conversation simple, sans panier.
 * Remontée sur mobile quand la barre du panier est affichée.
 */
export function QuestionButton({ href }: { href: string }) {
  const pathname = usePathname()
  const hasCart = useCart((s) => s.items.length > 0)
  const raised = hasCart && pathname !== '/panier'
  // Sur la page panier, le bouton « Commander sur WhatsApp » suffit.
  if (pathname === '/panier') return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      // Le texte reste accessible aux lecteurs d'écran via aria-label.
      aria-label="Une question ? Écrivez-nous sur WhatsApp"
      title="Une question ? Écrivez-nous sur WhatsApp"
      className={`fixed right-4 z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:scale-105 hover:bg-whatsapp-dark md:bottom-6 ${
        raised ? 'bottom-24' : 'bottom-6'
      }`}
    >
      <WhatsAppIcon className="size-8" />
    </a>
  )
}
