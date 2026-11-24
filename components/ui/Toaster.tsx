'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { create } from 'zustand'
import { CheckIcon, CloseIcon } from './icons'

interface Toast {
  id: number
  title: string
  detail?: string
}

interface ToastState {
  toast: Toast | null
  show: (t: Omit<Toast, 'id'>) => void
  hide: () => void
}

/** Notification unique (la plus récente remplace la précédente). */
export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (t) => set({ toast: { ...t, id: Date.now() } }),
  hide: () => set({ toast: null }),
}))

const DURATION = 3500

/**
 * Confirmation discrète après un ajout au panier, avec lien « Voir le panier ».
 * Se ferme seule ; annoncée aux lecteurs d'écran (role="status").
 */
export function Toaster() {
  const toast = useToast((s) => s.toast)
  const hide = useToast((s) => s.hide)
  const pathname = usePathname()

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(hide, DURATION)
    return () => window.clearTimeout(id)
  }, [toast, hide])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4" role="status" aria-live="polite">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 bg-brown-900 py-3 pl-4 pr-2 text-cream-50 shadow-2xl ring-1 ring-gold-400/40 transition duration-300 starting:-translate-y-3 starting:opacity-0 motion-reduce:transition-none"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-400 text-brown-900">
            <CheckIcon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{toast.title}</span>
            {toast.detail && <span className="block truncate text-xs text-cream-50/70">{toast.detail}</span>}
          </span>
          {pathname !== '/panier' && (
            <Link
              href="/panier"
              onClick={hide}
              className="shrink-0 px-3 py-2 text-sm font-semibold text-gold-400 transition hover:bg-white/5"
            >
              Voir le panier
            </Link>
          )}
          <button
            type="button"
            onClick={hide}
            className="flex size-9 shrink-0 items-center justify-center text-cream-50/60 hover:text-cream-50"
            aria-label="Fermer"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
