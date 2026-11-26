/**
 * Vidéos « inspiration » → documents `realisation` (kind = inspiration).
 *
 *   ./media-source/encode-inspirations.sh   (d'abord)
 *   npm run media:inspirations
 *
 * Originaux dans media-source/originaux/inspiration (non versionné).
 * Idempotent : IDs fixes (`inspiration-<fichier>`) et Sanity déduplique les fichiers.
 * Un document déjà modifié dans le Studio n'est pas écrasé (createIfNotExists).
 */
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient } from '@sanity/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DIR = 'media-source/optimise/inspiration'
const ORIGINALS = 'media-source/originaux/inspiration'

/** AV1 conservé seulement s'il fait gagner au moins 15 % sur le H.264. */
const AV1_MIN_GAIN = 0.85

type Item = { file: string; title: string; products: string[]; photo?: boolean }

/** Ordre d'affichage = ordre de ce tableau (les 4 premiers sur l'accueil). */
const ITEMS: Item[] = [
  { file: 'v08', title: 'Mur TV marbre rétroéclairé & tasseaux', products: ['feuille-marbree', 'tasseaux-bois'] },
  { file: 'v09', title: 'Papier peint vert & or', products: ['papier-peint-intisse'] },
  { file: 'v04', title: 'Salle à manger en tasseaux clairs', products: ['tasseaux-bois'] },
  { file: 'v12', title: 'Chambre bleu canard & filets dorés', products: ['papier-peint-intisse', 'ruban-decoratif-dore'] },
  { file: 'v03', title: 'Salle de bain en marbre noir', products: ['feuille-marbree'] },
  { file: 'v06', title: 'Faux carreaux effet marbre au sol', products: ['faux-carreaux-autocollants'] },
  { file: 'v07', title: 'Salon : mur TV en tasseaux noirs', products: ['tasseaux-bois'] },
  { file: 'v11', title: 'Ruban doré sur boiseries blanches', products: ['ruban-decoratif-dore'] },
  { file: 'v05', title: 'Sol PVC en rouleau : bois, carreaux, marbre', products: ['revetement-pvc'] },
  { file: 'v10', title: 'Papiers peints à motifs', products: ['papier-peint-autocollant'] },
  { file: 'v02', title: 'Plan de travail en marbre adhésif', products: ['feuille-marbree'], photo: true },
]

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

  const productIds = Object.fromEntries(
    (await client.fetch<{ _id: string; slug: string }[]>(`*[_type == "product"]{ _id, "slug": slug.current }`)).map(
      (p) => [p.slug, p._id],
    ),
  )
  const ref = (_ref: string, _key?: string) => ({ _type: 'reference' as const, _ref, ...(_key ? { _key } : {}) })
  const upload = async (kind: 'file' | 'image', path: string, contentType: string) => {
    const asset = await client.assets.upload(kind, await readFile(path), { filename: path.split('/').pop(), contentType })
    process.stdout.write('.')
    return asset._id
  }

  const today = new Date()
  for (const [i, item] of ITEMS.entries()) {
    // Dates décroissantes : l'ordre du tableau devient l'ordre d'affichage.
    const date = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10)
    let media: Record<string, unknown>
    if (item.photo) {
      const img = await upload('image', join(ORIGINALS, `${item.file}.jpg`), 'image/jpeg')
      media = { _key: 'photo', _type: 'image', asset: ref(img) }
    } else {
      const base = join(DIR, item.file)
      const [h264Size, av1Size] = await Promise.all([stat(`${base}.h264.mp4`), stat(`${base}.av1.mp4`)])
      const mp4 = await upload('file', `${base}.h264.mp4`, 'video/mp4')
      const av1 =
        av1Size.size <= h264Size.size * AV1_MIN_GAIN ? await upload('file', `${base}.av1.mp4`, 'video/mp4') : null
      const poster = await upload('image', `${base}.poster.jpg`, 'image/jpeg')
      media = {
        _key: 'video',
        _type: 'realisationVideo',
        mp4: { _type: 'file', asset: ref(mp4) },
        ...(av1 ? { av1: { _type: 'file', asset: ref(av1) } } : {}),
        poster: { _type: 'image', asset: ref(poster) },
      }
    }
    const missing = item.products.filter((s) => !productIds[s])
    if (missing.length) console.warn(`\n  ⚠ ${item.file} : produit(s) introuvable(s) ${missing.join(', ')}`)

    await client.createIfNotExists({
      _id: `inspiration-${item.file}`,
      _type: 'realisation',
      title: item.title,
      kind: 'inspiration',
      date,
      isVisible: true,
      media: [media],
      products: item.products.filter((s) => productIds[s]).map((s) => ref(productIds[s], s)),
    })
    console.log(` ${item.file} → ${item.title}`)
  }
  console.log('Terminé.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
