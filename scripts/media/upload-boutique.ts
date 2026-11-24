/**
 * Médias fournis par la boutique → Sanity.
 *
 *   npm run media:boutique
 *
 * - Carrousel d'accueil : clips vidéo optimisés (media-source/encode.sh d'abord).
 * - Photos des 5 catégories et photo « Pourquoi nous choisir ».
 * Les originaux sont dans media-source/originaux (non versionné).
 * Idempotent : Sanity déduplique les fichiers identiques.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import sharp from 'sharp'

config({ path: '.env.local' })

const ROOT = 'media-source'

/** Ordre du carrousel = ordre de ce tableau. */
const HERO_CLIPS = [
  { file: 'mur-tasseaux-lumineux', caption: 'Mur en tasseaux & appliques', alt: 'Mur TV habillé de tasseaux sombres avec appliques lumineuses' },
  { file: 'salon-tasseaux', caption: 'Salon : tasseaux bois', alt: 'Salon lumineux avec mur TV en tasseaux de bois clair' },
  { file: 'couloir-moulures', caption: 'Couloir : moulures & éclairage', alt: 'Couloir rénové avec moulures murales et plafond éclairé' },
]

/** slug de catégorie → photo originale */
const CATEGORY_PHOTOS: Record<string, string> = {
  'revetement-mural': 'IMG_3805.JPG',
  'revetement-sol': 'IMG_3811.JPG',
  plafond: 'IMG_3819.JPG',
  deco: 'IMG_3823.JPG',
  noel: 'IMG_3825.JPG',
}

const WHY_US_PHOTO = { file: 'IMG_3826.JPG', alt: 'Un poseur devant un mur décoratif rétroéclairé terminé' }

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

  const ref = (_ref: string) => ({ _type: 'reference' as const, _ref })

  /** Photo : orientation corrigée (EXIF), 2400 px max, JPEG qualité 85. */
  const uploadPhoto = async (name: string) => {
    const buffer = await sharp(join(ROOT, 'originaux', name))
      .rotate()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()
    const asset = await client.assets.upload('image', buffer, { filename: name.toLowerCase() })
    process.stdout.write('.')
    return asset._id
  }

  const uploadFile = async (path: string, contentType: string) => {
    const asset = await client.assets.upload('file', await readFile(path), {
      filename: path.split('/').pop(),
      contentType,
    })
    process.stdout.write('.')
    return asset._id
  }

  console.log('→ Clips du carrousel…')
  const slides: Record<string, unknown>[] = []
  for (const [i, clip] of HERO_CLIPS.entries()) {
    const base = join(ROOT, 'optimise', clip.file)
    const mp4 = await uploadFile(`${base}.h264.mp4`, 'video/mp4')
    const av1 = await uploadFile(`${base}.av1.mp4`, 'video/mp4')
    const poster = await client.assets.upload('image', await readFile(`${base}.poster.jpg`), {
      filename: `${clip.file}.jpg`,
    })
    slides.push({
      _key: `video${i}`,
      _type: 'heroVideo',
      mp4: { _type: 'file', asset: ref(mp4) },
      av1: { _type: 'file', asset: ref(av1) },
      poster: { _type: 'image', asset: ref(poster._id) },
      caption: clip.caption,
      alt: clip.alt,
    })
  }

  console.log('\n→ Photos des catégories et « Pourquoi nous choisir »…')
  const tx = client.transaction()
  tx.createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings', shopName: 'Revêt & Déco' })
  for (const [slug, file] of Object.entries(CATEGORY_PHOTOS)) {
    const assetId = await uploadPhoto(file)
    const ids = await client.fetch<string[]>(`*[_type == "category" && slug.current == $slug]._id`, { slug })
    for (const id of ids) tx.patch(id, (p) => p.set({ image: { _type: 'image', asset: ref(assetId) } }))
  }
  const whyUs = await uploadPhoto(WHY_US_PHOTO.file)
  tx.patch('siteSettings', (p) =>
    p.set({
      heroSlides: slides,
      whyUsImage: { _type: 'image', asset: ref(whyUs), alt: WHY_US_PHOTO.alt },
    }),
  )
  await tx.commit()
  console.log(`\n✓ ${slides.length} clips, ${Object.keys(CATEGORY_PHOTOS).length} photos de catégories et la photo « Pourquoi nous choisir » en place.`)
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err)
  process.exit(1)
})
