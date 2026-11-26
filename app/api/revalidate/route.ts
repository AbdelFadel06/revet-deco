import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import type { ContentTag } from '@/sanity/lib/fetch'

/**
 * Webhook Sanity → invalide le cache des pages qui dépendent du type modifié.
 *
 * À configurer sur sanity.io/manage → API → Webhooks :
 *   URL         : https://<site>/api/revalidate
 *   Méthode     : POST
 *   Événements  : create, update, delete
 *   Filtre      : _type in ["siteSettings","category","product","patternFamily","pattern","realisation"]
 *   Projection  : {_type, "slug": slug.current}
 *   Secret      : valeur de SANITY_REVALIDATE_SECRET
 */
const TAGS = new Set<ContentTag>(['siteSettings', 'category', 'product', 'patternFamily', 'pattern', 'realisation'])

// Chaque appel à `sanityFetch` déclare TOUS les types qu'il lit (voir
// sanity/lib/data.ts) : il suffit donc d'invalider le type modifié.

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return Response.json({ message: 'SANITY_REVALIDATE_SECRET manquant' }, { status: 500 })
  }

  try {
    // `true` : attend la cohérence de Content Lake avant de revalider.
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret, true)

    if (!isValidSignature) {
      return Response.json({ message: 'Signature invalide' }, { status: 401 })
    }
    const type = body?._type as ContentTag | undefined
    if (!type || !TAGS.has(type)) {
      return Response.json({ message: 'Type non géré', type }, { status: 400 })
    }

    revalidateTag(type, 'max')
    return Response.json({ revalidated: true, tag: type, now: Date.now() })
  } catch (err) {
    console.error('[revalidate]', err)
    return Response.json({ message: 'Erreur lors de la revalidation' }, { status: 500 })
  }
}
