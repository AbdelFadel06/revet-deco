/**
 * Migration : anciens champs `image` (+ `roomImage`) → nouveau champ `photos`.
 *
 *   npx tsx scripts/migrations/pattern-photos.ts
 *
 * Pour chaque motif qui n'a pas encore de `photos` : photos = [image, roomImage?].
 * Idempotent (un motif déjà migré n'est pas touché). Les anciens champs sont
 * conservés (masqués dans le Studio) par sécurité.
 */
import { createClient } from '@sanity/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

interface Img {
  _type: 'image'
  asset?: { _ref: string }
  crop?: unknown
  hotspot?: unknown
}

async function main() {
  const token = process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_WRITE_TOKEN manquant dans .env.local')
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    token,
    apiVersion: '2025-01-01',
    useCdn: false,
  })

  const docs = await client.fetch<{ _id: string; image?: Img; roomImage?: Img }[]>(
    `*[_type == "pattern" && !defined(photos) && (defined(image.asset) || defined(roomImage.asset))]{ _id, image, roomImage }`,
  )
  if (docs.length === 0) return console.log('✓ Rien à migrer.')

  const tx = client.transaction()
  for (const d of docs) {
    const photos = [d.image, d.roomImage]
      .filter((i): i is Img => Boolean(i?.asset))
      .map((i, k) => ({ ...i, _type: 'image' as const, _key: `p${k}` }))
    tx.patch(d._id, (p) => p.set({ photos }))
  }
  await tx.commit()
  console.log(`✓ ${docs.length} motifs migrés vers le champ « Photos ».`)
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err)
  process.exit(1)
})
