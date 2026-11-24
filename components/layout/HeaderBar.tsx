'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronRightIcon, CloseIcon, MenuIcon, PhoneIcon, TikTokIcon, WhatsAppIcon } from '@/components/ui/icons'
import { formatBeninPhone } from '@/lib/format'
import { CartButton } from './CartButton'

export interface NavLink {
  href: string
  /** Nom court (« Mur ») */
  label: string
  /** Nom complet (« Revêtement mural ») */
  title: string
  /** Produits de la catégorie (sous-menu du menu mobile) */
  children?: { href: string; label: string }[]
}

/** Vrai dès que la page a défilé de quelques pixels. */
function useScrolled(threshold = 24) {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('scroll', cb, { passive: true })
      return () => window.removeEventListener('scroll', cb)
    },
    () => window.scrollY > threshold,
    () => false,
  )
}

/**
 * En-tête transparent sur tout le site :
 * - sur les photos du hero (accueil, en haut) : fond transparent, texte blanc ;
 * - ailleurs ou dès qu'on défile : couleurs d'identité du footer
 *   (brun espresso légèrement translucide, logo or, liens crème).
 * Logo à gauche ; menus + panier à droite ; burger sur mobile.
 */
export function HeaderBar({ shopName, links, contact }: { shopName: string; links: NavLink[]; contact: MenuContact }) {
  const pathname = usePathname()
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)
  const overPhoto = pathname === '/' && !scrolled && !menuOpen

  return (
    // Barre pleine largeur, collée en haut (la version « flottante » a été essayée puis abandonnée).
    <header
      className={`sticky top-0 z-40 transition-[background-color,color,box-shadow] duration-300 ${
        overPhoto
          ? 'bg-linear-to-b from-ink-900/45 to-transparent text-white'
          : 'bg-brown-900/95 text-cream-50 shadow-[0_1px_0_0_var(--color-gold-400)] backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className={`font-serif text-2xl leading-none ${overPhoto ? 'text-white' : 'text-gold-400'}`}
          aria-label={`${shopName} – accueil`}
        >
          {shopName}
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Catégories" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {links.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      title={l.title}
                      aria-current={active ? 'page' : undefined}
                      className={`px-3 py-2 text-sm font-medium transition ${
                        overPhoto
                          ? `text-white ${active ? 'bg-white/20' : 'hover:bg-white/15'}`
                          : active
                            ? 'bg-white/10 text-gold-400'
                            : 'text-cream-50/90 hover:bg-white/5 hover:text-gold-400'
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <CartButton tone={overPhoto ? 'light' : 'gold'} />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`-mr-2 flex size-11 items-center justify-center md:hidden ${
              overPhoto ? 'hover:bg-white/15' : 'text-gold-400 hover:bg-white/5'
            }`}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={links} shopName={shopName} contact={contact} />
    </header>
  )
}

export interface MenuContact {
  /** Numéro au format 229XXXXXXXXXX */
  whatsappNumber: string | null
  tiktok: string | null
  tagline: string | null
}

/**
 * Menu latéral mobile aux couleurs de la marque (brun espresso, or, crème) :
 * catégories en accordéon avec leurs produits, puis un bloc contact en bas.
 */
function MobileMenu({
  open,
  onClose,
  links,
  shopName,
  contact,
}: {
  open: boolean
  onClose: () => void
  links: NavLink[]
  shopName: string
  contact: MenuContact
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()

  // Synchronise la modale native (focus piégé, Échap) avec l'état React.
  // Chaque lien appelle onClose : le menu se ferme après une navigation.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const phone = contact.whatsappNumber
  const contactLink = 'flex min-h-11 items-center gap-3 text-sm text-cream-50/85 transition hover:text-gold-400'

  return (
    <dialog
      id="menu-mobile"
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Menu"
      // Panneau qui glisse depuis la droite (côté burger), fond assombri en fondu.
      // Animation d'ouverture ET de fermeture en CSS natif : @starting-style (starting:)
      // + transition-behavior: allow-discrete (transition-discrete) sur display/overlay,
      // pour que la modale reste visible pendant qu'elle ressort.
      className="m-0 ml-auto h-dvh max-h-none w-[min(88vw,24rem)] max-w-none translate-x-full bg-brown-900 p-0 text-cream-50 shadow-2xl transition-[translate,overlay,display] transition-discrete duration-300 ease-out open:translate-x-0 starting:open:translate-x-full backdrop:bg-ink-900/0 backdrop:backdrop-blur-none backdrop:transition-[background-color,backdrop-filter,overlay,display] backdrop:transition-discrete backdrop:duration-300 open:backdrop:bg-ink-900/60 open:backdrop:backdrop-blur-sm starting:open:backdrop:bg-ink-900/0 starting:open:backdrop:backdrop-blur-none motion-reduce:transition-none md:hidden"
    >
      <div className="flex h-full flex-col">
        {/* En-tête du panneau */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <span className="font-serif text-2xl text-gold-400">{shopName}</span>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex size-11 items-center justify-center text-gold-400 transition hover:bg-white/5"
            aria-label="Fermer le menu"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mx-5 h-px bg-gold-400/40" aria-hidden />

        {/* Catégories */}
        <nav aria-label="Catégories" className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold-400">Nos univers</p>
          <ul className="mt-2">
            {links.map((l) => {
              const current = pathname === l.href || pathname.startsWith(`${l.href}/`)
              const heading = (
                <span className="min-w-0">
                  <span className={`block font-serif text-2xl leading-tight ${current ? 'text-gold-400' : 'text-cream-50'}`}>
                    {l.label}
                  </span>
                  {l.label !== l.title && <span className="block text-xs text-cream-50/55">{l.title}</span>}
                </span>
              )
              // Catégorie sans produit : simple lien.
              if (!l.children?.length) {
                return (
                  <li key={l.href} className="border-b border-white/10">
                    <Link href={l.href} onClick={onClose} className="flex min-h-16 items-center justify-between gap-3 py-2">
                      {heading}
                      <ChevronRightIcon className="size-5 shrink-0 text-gold-400" />
                    </Link>
                  </li>
                )
              }
              // Catégorie avec produits : accordéon (ouvert sur la catégorie en cours).
              return (
                <li key={l.href} className="border-b border-white/10">
                  <details open={current} className="group">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 py-2 [&::-webkit-details-marker]:hidden">
                      {heading}
                      <ChevronRightIcon className="size-5 shrink-0 text-gold-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <ul className="mb-4 ml-1 border-l border-gold-400/40 pl-4">
                      {l.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            onClick={onClose}
                            aria-current={pathname === c.href ? 'page' : undefined}
                            className="flex min-h-11 items-center text-[0.95rem] text-cream-50/80 transition hover:text-gold-400 aria-[current=page]:font-semibold aria-[current=page]:text-gold-400"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href={l.href}
                          onClick={onClose}
                          className="flex min-h-11 items-center gap-1 text-sm font-medium text-gold-400"
                        >
                          Tout voir <ChevronRightIcon className="size-4" />
                        </Link>
                      </li>
                    </ul>
                  </details>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Contact */}
        {(phone || contact.tiktok) && (
          <div className="shrink-0 border-t border-white/10 bg-ink-900/25 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-gold-400">Contact</p>
            <ul className="mt-1">
              {phone && (
                <>
                  <li>
                    <a href={`tel:+${phone}`} className={contactLink}>
                      <PhoneIcon className="size-5 text-gold-400" />
                      {formatBeninPhone(phone)}
                    </a>
                  </li>
                  <li>
                    <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener" className={contactLink}>
                      <WhatsAppIcon className="size-5 text-gold-400" />
                      Écrire sur WhatsApp
                    </a>
                  </li>
                </>
              )}
              {contact.tiktok && (
                <li>
                  <a href={contact.tiktok} target="_blank" rel="noopener" className={contactLink}>
                    <TikTokIcon className="size-5 text-gold-400" />
                    Suivez-nous sur TikTok
                  </a>
                </li>
              )}
            </ul>
            {contact.tagline && <p className="mt-2 font-serif text-sm italic text-cream-50/50">{contact.tagline}</p>}
          </div>
        )}
      </div>
    </dialog>
  )
}
