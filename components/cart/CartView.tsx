'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCartView, type CartDisplay } from '@/app/actions/cart'
import { AvailabilityBadge } from '@/components/catalog/badges'
import { CheckIcon, WhatsAppIcon } from '@/components/ui/icons'
import { QtyStepper } from '@/components/ui/QtyStepper'
import { SanityImage } from '@/components/ui/SanityImage'
import { track } from '@/lib/analytics'
import { formatPrice, unitLabel } from '@/lib/format'
import type { CartLineDetail, CartProductGroup, CartTotals } from '@/lib/pricing'
import type { CartItem } from '@/lib/types'
import { buildWhatsAppMessage, buildWhatsAppUrl, WHATSAPP_NUMBER_REGEX } from '@/lib/whatsapp'
import { useCart, useCartHydrated } from './cartStore'

interface Props {
  shopName: string
  whatsappNumber: string | null
}

type View = { totals: CartTotals; display: CartDisplay }

/** Recalcule le panier (prix actuels de Sanity) à chaque changement. */
function useCartView(items: CartItem[]) {
  const [result, setResult] = useState<{ for: CartItem[]; view: View | null; error: boolean } | null>(null)

  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    getCartView(items)
      .then((view) => !cancelled && setResult({ for: items, view, error: false }))
      .catch(() => !cancelled && setResult({ for: items, view: null, error: true }))
    return () => {
      cancelled = true
    }
  }, [items])

  return {
    view: items.length === 0 ? null : (result?.view ?? null),
    pending: items.length > 0 && result?.for !== items,
    error: result?.error ?? false,
  }
}

/**
 * Page panier, pensée pour le téléphone :
 * - lignes épurées (photo, code, quantité, total de la ligne) ;
 * - le palier de prix résumé en une phrase par produit ;
 * - total + bouton WhatsApp toujours visibles (barre fixe sur mobile).
 */
export function CartView({ shopName, whatsappNumber }: Props) {
  const hydrated = useCartHydrated()
  const items = useCart((s) => s.items)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const clear = useCart((s) => s.clear)
  const { view, pending, error } = useCartView(items)
  const [sent, setSent] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  if (!hydrated || (items.length > 0 && !view && !error)) {
    return <p className="py-20 text-center text-brown-700">Chargement du panier…</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center border border-gold-200 bg-cream-50 px-6 py-16 text-center">
        <p className="font-serif text-3xl text-brown-900">Votre panier est vide</p>
        <p className="mt-2 max-w-sm text-brown-700">Parcourez nos motifs et ajoutez ceux qui vous plaisent.</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center bg-brown-900 px-6 font-semibold text-gold-200 transition hover:bg-brown-700"
        >
          Voir le catalogue
        </Link>
      </div>
    )
  }

  if (error || !view) {
    return (
      <p className="py-20 text-center text-brown-700">
        Impossible de calculer le panier pour le moment. Vérifiez votre connexion et rechargez la page.
      </p>
    )
  }

  const { totals, display } = view
  const numberOk = Boolean(whatsappNumber && WHATSAPP_NUMBER_REGEX.test(whatsappNumber))
  const message =
    totals.groups.length > 0
      ? buildWhatsAppMessage(totals, { shopName, whatsappNumber: whatsappNumber ?? '' })
      : ''
  const waUrl = numberOk && message ? buildWhatsAppUrl(whatsappNumber!, message) : null

  const onOrder = (e: React.MouseEvent) => {
    if (pending) {
      e.preventDefault()
      return
    }
    track('whatsapp_click', { items: totals.itemCount, total: totals.total })
    setSent(true)
  }

  const orderButton = (className: string, label: string) =>
    waUrl ? (
      <a href={waUrl} target="_blank" rel="noopener" aria-disabled={pending} onClick={onOrder} className={className}>
        <WhatsAppIcon className="size-6 shrink-0" />
        {label}
      </a>
    ) : null

  return (
    <>
      <div
        className={`grid gap-6 pb-32 lg:grid-cols-[1fr_23rem] lg:gap-10 lg:pb-0 ${pending ? 'opacity-70 transition-opacity' : ''}`}
        aria-busy={pending}
      >
        {/* Articles */}
        <div className="flex flex-col gap-10">
          {totals.groups.map((g) => (
            <ProductGroup
              key={g.product.id}
              group={g}
              display={display}
              onQty={(code, qty) => setQty(g.product.id, code, qty)}
              onRemove={(code) => remove(g.product.id, code)}
            />
          ))}

          {totals.invalidItems.length > 0 && (
            <section className="border-t border-gold-400/70 pt-4">
              <h2 className="font-semibold text-ink-900">Articles indisponibles</h2>
              <p className="text-sm text-brown-700">Ils ne sont pas comptés dans le total.</p>
              <ul className="mt-2">
                {totals.invalidItems.map(({ item, reason }) => (
                  <li key={`${item.productId}-${item.patternCode}`} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      {item.patternCode && <span className="pattern-code text-brown-900">{item.patternCode} </span>}
                      <span className="text-brown-700">{reason === 'epuise' ? '· Épuisé' : '· N’est plus au catalogue'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(item.productId, item.patternCode)}
                      className="min-h-11 px-2 font-medium text-brown-900 underline underline-offset-4"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link href="/" className="self-start py-2 text-sm font-medium text-brown-700 underline-offset-4 hover:underline">
            ← Continuer mes achats
          </Link>
        </div>

        {/* Récapitulatif (colonne de droite sur ordinateur, à la suite sur mobile) */}
        <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-24">
          <section className="bg-brown-900 p-5 text-cream-50" aria-labelledby="summary-title">
            <h2 id="summary-title" className="sr-only">
              Récapitulatif
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-cream-50/75">
                <dt>Articles</dt>
                <dd>{totals.itemCount}</dd>
              </div>
              {totals.savings > 0 && (
                <div className="flex justify-between text-gold-200">
                  <dt>Économie</dt>
                  <dd>− {formatPrice(totals.savings)}</dd>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t border-white/15 pt-3">
                <dt className="font-medium">Total estimé</dt>
                <dd className="font-serif text-3xl text-gold-200">{formatPrice(totals.total)}</dd>
              </div>
            </dl>

            {/* Bouton : toujours ici, et aussi dans la barre fixe en bas sur mobile */}
            {orderButton(
              'mt-5 flex min-h-13 items-center justify-center gap-2 bg-whatsapp px-5 py-3 font-semibold text-white transition hover:bg-whatsapp-dark aria-disabled:opacity-60',
              'Commander sur WhatsApp',
            )}
            {!waUrl && (
              <p className="mt-5 bg-white/10 p-3 text-sm">
                {numberOk
                  ? 'Ajoutez au moins un article disponible pour commander.'
                  : 'La commande WhatsApp sera disponible dès que la boutique aura renseigné son numéro.'}
              </p>
            )}

            {message && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-cream-50/70 hover:text-gold-400">Voir le message envoyé</summary>
                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap bg-white/5 p-3 font-sans text-xs text-cream-50/90">
                  {message}
                </pre>
              </details>
            )}
          </section>

          {/* Après l'envoi : on ne vide jamais automatiquement, on propose. */}
          {sent && (
            <section className="border border-gold-200 bg-cream-50 p-5 text-sm" role="status">
              <p className="flex items-center gap-2 font-semibold text-ink-900">
                <CheckIcon className="size-5 text-status-ok" /> Message prêt dans WhatsApp
              </p>
              <p className="mt-1 text-brown-700">Envoyez-le : la boutique vous répond rapidement. Vous pouvez garder ce panier ou le vider.</p>
              {confirmClear ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clear()
                      setSent(false)
                      setConfirmClear(false)
                    }}
                    className="min-h-11 flex-1 bg-brown-900 px-4 font-semibold text-gold-200"
                  >
                    Oui, vider
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)} className="min-h-11 flex-1 border border-brown-900 px-4">
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="mt-3 min-h-11 w-full border border-brown-900 px-4 font-medium text-brown-900"
                >
                  Vider le panier
                </button>
              )}
            </section>
          )}
        </aside>
      </div>

      {/* Barre fixe mobile : total + commande toujours visibles */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-xs text-brown-700">Total estimé</p>
            <p className="font-serif text-2xl leading-tight text-brown-900">{formatPrice(totals.total)}</p>
          </div>
          {orderButton(
            'flex min-h-12 flex-1 items-center justify-center gap-2 bg-whatsapp px-4 font-semibold text-white transition active:scale-[0.98] aria-disabled:opacity-60',
            'Commander',
          )}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------

function ProductGroup({
  group,
  display,
  onQty,
  onRemove,
}: {
  group: CartProductGroup
  display: CartDisplay
  onQty: (code: string | null, qty: number) => void
  onRemove: (code: string | null) => void
}) {
  const { product, lines, subtotal, savings, nextTier } = group
  const info = display.products[product.id]
  const hasPatterns = lines.some((l) => l.patternCode)
  const reduced = savings > 0 ? lines.find((l) => l.unitPrice < l.baseUnitPrice) : null

  return (
    <section aria-label={product.title}>
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl leading-tight text-brown-900">
          {info?.href ? <Link href={info.href}>{product.title}</Link> : product.title}
        </h2>
        <p className="shrink-0 font-semibold text-ink-900">{formatPrice(subtotal)}</p>
      </header>

      {/* Palier résumé en une phrase */}
      {reduced && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-status-ok">
          <CheckIcon className="size-3.5" />
          Prix réduit : {formatPrice(reduced.unitPrice)} / {unitLabel(product.unit, 1)}
        </p>
      )}
      {!reduced && nextTier && (
        <p className="mt-1.5 text-xs text-brown-700">
          Plus que <strong>{nextTier.qtyNeeded}</strong> {unitLabel(product.unit, nextTier.qtyNeeded)} pour passer à{' '}
          <strong>{formatPrice(nextTier.unitPrice)}</strong> l’unité.
        </p>
      )}

      <ul className="mt-3 border-t border-gold-400/70">
        {lines.map((l) => (
          <Line
            key={l.patternCode ?? product.id}
            line={l}
            title={hasPatterns ? null : product.title}
            image={l.patternCode ? display.patterns[l.patternCode]?.image : info?.image}
            href={l.patternCode ? display.patterns[l.patternCode]?.href : info?.href}
            onQty={(q) => onQty(l.patternCode, q)}
            onRemove={() => onRemove(l.patternCode)}
          />
        ))}
      </ul>
    </section>
  )
}

function Line({
  line,
  title,
  image,
  href,
  onQty,
  onRemove,
}: {
  line: CartLineDetail
  title: string | null
  image: CartDisplay['patterns'][string]['image'] | undefined
  href: string | null | undefined
  onQty: (qty: number) => void
  onRemove: () => void
}) {
  const label = line.patternCode ? `${line.patternCode} – ${line.patternName ?? ''}` : (title ?? '')
  const thumb = <SanityImage image={image} alt="" aspect={1} sizes="72px" className="size-18 shrink-0 object-cover" />

  return (
    <li className="flex gap-4 border-b border-gold-400/70 py-4">
      {href ? (
        <Link href={href} aria-label={label} className="shrink-0">
          {thumb}
        </Link>
      ) : (
        thumb
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="min-w-0">
          {line.patternCode ? (
            <>
              <p className="pattern-code leading-tight text-brown-900">{line.patternCode}</p>
              <p className="truncate text-sm text-brown-700">{line.patternName}</p>
            </>
          ) : (
            <p className="font-medium leading-tight text-ink-900">{title}</p>
          )}
          <AvailabilityBadge availability={line.availability} className="mt-1" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <QtyStepper value={line.qty} onChange={onQty} label={`Quantité ${label}`} />
          <div className="text-right">
            <p className="font-semibold text-ink-900">{formatPrice(line.lineTotal)}</p>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-brown-700 underline-offset-4 hover:text-ink-900 hover:underline"
              aria-label={`Retirer ${label}`}
            >
              Retirer
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
