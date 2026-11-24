import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'
import { getSettings } from '@/sanity/lib/data'

export const metadata: Metadata = {
  title: 'Panier',
  robots: { index: false },
}

export default async function CartPage() {
  const settings = await getSettings()
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="font-serif text-4xl text-brown-900">Votre panier</h1>
      <p className="mt-1 text-brown-700">Vérifiez votre sélection, puis envoyez-la sur WhatsApp en un geste.</p>
      <div className="mt-6">
        <CartView shopName={settings?.shopName ?? 'Revêt & Déco'} whatsappNumber={settings?.whatsappNumber ?? null} />
      </div>
    </div>
  )
}
