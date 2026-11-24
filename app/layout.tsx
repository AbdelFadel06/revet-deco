import type { Metadata } from 'next'
import { Gloock, Outfit } from 'next/font/google'
import './globals.css'

const gloock = Gloock({ variable: '--font-gloock', subsets: ['latin'], weight: '400' })
const outfit = Outfit({ variable: '--font-outfit', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Revêt & Déco · La rénovation à petit budget', template: '%s · Revêt & Déco' },
  description:
    'Papier peint autocollant, revêtements de sol, faux plafonds et décoration à petit prix au Bénin. Commandez sur WhatsApp.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={`${gloock.variable} ${outfit.variable} h-full antialiased`}>
      {/* suppressHydrationWarning : certaines extensions (Grammarly…) ajoutent des
          attributs au <body>. Ne concerne que les attributs de cette balise. */}
      <body className="flex min-h-full flex-col bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
