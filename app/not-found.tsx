import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-serif text-6xl text-gold-400">404</p>
      <h1 className="mt-4 font-serif text-3xl text-brown-900">Page introuvable</h1>
      <p className="mt-2 text-brown-700">Ce produit ou cette page n’existe pas (ou plus).</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center bg-brown-900 px-5 font-semibold text-gold-200 hover:bg-brown-700"
      >
        Retour à l’accueil
      </Link>
    </main>
  )
}
