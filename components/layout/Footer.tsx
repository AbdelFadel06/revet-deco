import { MapPinIcon, PhoneIcon, TikTokIcon, WhatsAppIcon } from '@/components/ui/icons'
import { formatBeninPhone } from '@/lib/format'
import { mapHref } from '@/lib/routes'
import { buildWhatsAppUrl, WHATSAPP_NUMBER_REGEX } from '@/lib/whatsapp'
import type { SETTINGS_QUERY_RESULT } from '@/sanity/types'

/** Nom d'utilisateur TikTok à partir de l'URL (« @revet.deco »). */
function tiktokHandle(url: string): string {
  const m = /tiktok\.com\/(@[^/?#]+)/.exec(url)
  return m ? m[1] : 'TikTok'
}

/**
 * Pied de page : nom + slogan, contact (téléphone, WhatsApp, TikTok),
 * localisation de la boutique + bouton carte, et le texte « Commander ».
 * Tout vient des Réglages du site (Studio).
 */
export function Footer({ settings }: { settings: SETTINGS_QUERY_RESULT }) {
  const shopName = settings?.shopName ?? 'Revêt & Déco'
  const number = settings?.whatsappNumber && WHATSAPP_NUMBER_REGEX.test(settings.whatsappNumber) ? settings.whatsappNumber : null
  const tiktok = settings?.socials?.tiktok ?? null
  const address = settings?.address ?? null
  // Lien Maps saisi s'il est valide, sinon recherche Maps sur le nom + l'adresse.
  const mapUrl = mapHref(settings?.mapUrl ?? null, shopName, settings?.address ?? null)

  const linkClass = 'inline-flex min-h-11 items-center gap-2.5 transition hover:text-gold-400'

  return (
    <footer className="mt-16 bg-brown-900 pb-24 text-cream-50/85 md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Identité */}
        <div>
          <p className="font-serif text-3xl text-gold-400">{shopName}</p>
          {settings?.tagline && <p className="mt-2 text-sm">{settings.tagline}</p>}
        </div>

        {/* Contact */}
        <div className="text-sm">
          <p className="font-medium uppercase tracking-[0.15em] text-gold-400">Contact</p>
          <ul className="mt-3 flex flex-col">
            {number && (
              <>
                <li>
                  <a href={`tel:+${number}`} className={linkClass}>
                    <PhoneIcon className="size-5 text-gold-400" />
                    {formatBeninPhone(number)}
                  </a>
                </li>
                <li>
                  <a href={buildWhatsAppUrl(number)} target="_blank" rel="noopener" className={linkClass}>
                    <WhatsAppIcon className="size-5 text-gold-400" />
                    WhatsApp
                  </a>
                </li>
              </>
            )}
            {tiktok && (
              <li>
                <a href={tiktok} target="_blank" rel="noopener" className={linkClass}>
                  <TikTokIcon className="size-5 text-gold-400" />
                  {tiktokHandle(tiktok)}
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Localisation */}
        {(address || mapUrl) && (
          <div className="text-sm">
            <p className="font-medium uppercase tracking-[0.15em] text-gold-400">La boutique</p>
            {address && <p className="mt-3 whitespace-pre-line leading-relaxed">{address}</p>}
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener"
                className="mt-4 inline-flex min-h-11 items-center gap-2 border border-gold-400 px-5 font-medium text-gold-200 transition hover:bg-gold-400 hover:text-brown-900"
              >
                <MapPinIcon className="size-5" />
                Voir sur la carte
              </a>
            )}
          </div>
        )}

        {/* Commander */}
        <div className="text-sm">
          <p className="font-medium uppercase tracking-[0.15em] text-gold-400">Commander</p>
          <p className="mt-3 leading-relaxed">
            Ajoutez vos articles au panier puis envoyez la commande sur WhatsApp. La boutique vous répond pour le
            paiement et la livraison.
          </p>
        </div>
      </div>
    </footer>
  )
}
