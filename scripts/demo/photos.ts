/**
 * Photos réelles PROVISOIRES (Unsplash, licence libre d'usage commercial) pour
 * le carrousel d'accueil et les catégories. À remplacer par les photos de la
 * boutique et de ses équipes, directement dans le Studio.
 *
 *   npm run seed:photos
 *
 * Crédits : voir data/credits-photos.md
 */
import { createClient } from '@sanity/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

interface Photo {
  id: string
  photographer: string
  page: string
}

const unsplash = (id: string, width = 1800) => `https://images.unsplash.com/${id}?w=${width}&q=82&fm=jpg`

/** Carrousel d'accueil : intérieurs finis où le revêtement mural est la vedette (sans personnes). */
const HERO: (Photo & { caption: string; alt: string })[] = [
  {
    id: 'photo-1793891465698-6728e902ecdb',
    photographer: 'Alef Morais',
    page: 'https://unsplash.com/photos/egYwvFvKHYI',
    caption: 'Mur effet pierre',
    alt: 'Salon lumineux avec un grand mur effet pierre blanche',
  },
  {
    id: 'photo-1773867567704-6e39f26a5655',
    photographer: 'Franco Debartolo',
    page: 'https://unsplash.com/photos/0ps-o6iCVf0',
    caption: 'Tasseaux noirs & effet marbre',
    alt: 'Mur combinant tasseaux noirs et grand panneau effet marbre blanc',
  },
  {
    id: 'photo-1633604712918-6ab1173d0ecd',
    photographer: 'sheela sahani',
    page: 'https://unsplash.com/photos/mJk3xEjXnBU',
    caption: 'Mur TV en tasseaux bois',
    alt: 'Salon avec un mur TV habillé de tasseaux de bois clair',
  },
  {
    id: 'photo-1787539386413-b47ef9ab4020',
    photographer: 'Franco Debartolo',
    page: 'https://unsplash.com/photos/ZEjCKGX1uU8',
    caption: 'Effet marbre noir',
    alt: 'Mur effet marbre noir veiné dans un salon moderne',
  },
  {
    id: 'photo-1783125127172-bf92255c541a',
    photographer: 'Salvo Media LLC',
    page: 'https://unsplash.com/photos/kCLj_2TetQ8',
    caption: 'Mur effet brique',
    alt: 'Pièce lumineuse avec un mur effet brique et un parquet clair',
  },
]

/** Une photo par catégorie (slug → photo). */
const CATEGORIES: Record<string, Photo> = {
  'revetement-mural': { id: 'photo-1784318519037-7ee0b1668e95', photographer: 'Clay Banks', page: 'https://unsplash.com/photos/9MbWyxGzvD0' },
  'revetement-sol': { id: 'photo-1716315325541-776e39f9725f', photographer: 'Artem', page: 'https://unsplash.com/photos/wOJRzQ4Kx1g' },
  plafond: { id: 'photo-1696515559862-3e55fb519050', photographer: 'Maurice Sahl', page: 'https://unsplash.com/photos/wQIvSMXMS3o' },
  deco: { id: 'photo-1588622673923-83a6e5fe723d', photographer: 'karin boon', page: 'https://unsplash.com/photos/v5MFEeyD7lQ' },
  noel: { id: 'photo-1639686767840-1204e5c294b8', photographer: 'Nick Fewings', page: 'https://unsplash.com/photos/mjtMGJ7k0YA' },
}

/**
 * Photo principale de chaque produit (cartes produits).
 * À lancer APRÈS `npm run seed:demo`, qui remet les visuels générés.
 */
const PRODUCTS: Record<string, Photo> = {
  'papier-peint-autocollant': { id: 'photo-1551893478-d726eaf0442c', photographer: 'Angèle Kamp', page: 'https://unsplash.com/photos/-OQbUQce54k' },
  'papier-peint-intisse': { id: 'photo-1737987080402-87173292369d', photographer: 'Haberdoedas', page: 'https://unsplash.com/photos/15NoplkW504' },
  'feuille-marbree': { id: 'photo-1787539386413-b47ef9ab4020', photographer: 'Franco Debartolo', page: 'https://unsplash.com/photos/ZEjCKGX1uU8' },
  'panneau-3d': { id: 'photo-1695066380132-139a0f26743f', photographer: 'Leiada Krözjhen', page: 'https://unsplash.com/photos/caZpb3B7wkI' },
  'tasseaux-bois': { id: 'photo-1722109997425-40f920848aed', photographer: 'Maksim Shutov', page: 'https://unsplash.com/photos/YpK65tUQipg' },
  'revetement-pvc': { id: 'photo-1573869908170-64b53a60d8da', photographer: 'Hal Gatewood', page: 'https://unsplash.com/photos/JL-Wz38iawg' },
  'faux-carreaux-autocollants': { id: 'photo-1560005627-c96e0aeb6eaa', photographer: 'Klavs Krumins', page: 'https://unsplash.com/photos/NUNCMVc6Bwg' },
  'plancher-a-clic': { id: 'photo-1575204015311-0fe377370780', photographer: 'Jurre Houtkamp', page: 'https://unsplash.com/photos/610ZXDQRt0Y' },
  'faux-staff': { id: 'photo-1568989247455-145c52d1280d', photographer: 'Nervewax', page: 'https://unsplash.com/photos/SbREwbDuLZw' },
  'spray-peinture-or': { id: 'photo-1594896733292-9a77b5809c63', photographer: 'Peter Olexa', page: 'https://unsplash.com/photos/Ax6ggq8cSxw' },
  'spray-peinture-noir-mat': { id: 'photo-1573945165156-450271ce96ac', photographer: 'mohammed idris djoudi', page: 'https://unsplash.com/photos/cfdf1W88GQE' },
  'ruban-decoratif-dore': { id: 'photo-1786172326397-6ab3f8093df3', photographer: 'Mohammed Kara', page: 'https://unsplash.com/photos/6PD6vSqnuhM' },
  'sapin-de-noel': { id: 'photo-1764770591350-9c11967e1d19', photographer: 'R. G', page: 'https://unsplash.com/photos/j8Ev67vSv6s' },
  'boules-de-noel': { id: 'photo-1544863308-ec385bbf5caa', photographer: 'Reuben Teo', page: 'https://unsplash.com/photos/fmEgx4QalQU' },
  'fleurs-de-noel': { id: 'photo-1576252137965-bfee510aaa6a', photographer: 'Jessica Fadel', page: 'https://unsplash.com/photos/2B3quIShwJM' },
}

/**
 * Photo réelle de chaque motif de démo (code → photo + nom correspondant à la photo).
 * À lancer APRÈS `npm run seed:demo`.
 */
const PATTERNS: Record<string, Photo & { name: string }> = {
  'PP-M01': { id: 'photo-1653823357555-ca67b53821be', photographer: 'Filippo Agazzi', page: 'https://unsplash.com/photos/lkpek6r6yOQ', name: 'Marbre blanc & losanges or' },
  'PP-M02': { id: 'photo-1738664926482-1a986adb3e6c', photographer: 'HW KIM', page: 'https://unsplash.com/photos/nlE0ryeI6yQ', name: 'Marbre noir & or' },
  'PP-M03': { id: 'photo-1786673211400-90f79d15b1ff', photographer: 'Kier in Sight Archives', page: 'https://unsplash.com/photos/HXPUOdHuYoU', name: 'Marbre noir veiné blanc' },
  'PP-M04': { id: 'photo-1777976559740-4b7dc6ef3cdb', photographer: 'Heng Chiu', page: 'https://unsplash.com/photos/pf_Ha8_6GGU', name: 'Marbre gris nuagé' },
  'PP-M05': { id: 'photo-1532644440111-bc94f97955c1', photographer: 'Olga Thelavart', page: 'https://unsplash.com/photos/lIg6fu2yxFk', name: 'Marbre vert émeraude' },
  'PP-L01': { id: 'photo-1675528030748-d463ab87e8d5', photographer: 'Jan Kopřiva', page: 'https://unsplash.com/photos/J4Ticm2cX34', name: 'Lambris bois doré' },
  'PP-L02': { id: 'photo-1543751416-705d3e34d02a', photographer: 'Ria', page: 'https://unsplash.com/photos/oZzoDW61aoM', name: 'Lambris brun foncé' },
  'PP-L03': { id: 'photo-1551364827-375ede57f397', photographer: 'kerr', page: 'https://unsplash.com/photos/atCZ7EAMVLo', name: 'Lambris bois & noir' },
  'PP-L04': { id: 'photo-1768591189203-8c05a55a36f5', photographer: 'Florian Schindler', page: 'https://unsplash.com/photos/vUzQBkjNkEE', name: 'Bois orangé' },
  'PP-L05': { id: 'photo-1736506159776-22ca388780fa', photographer: 'The Cleveland Museum of Art', page: 'https://unsplash.com/photos/AD8nr59mr5c', name: 'Bois wengé' },
  'PP-F01': { id: 'photo-1770977882660-8eebe61e37cf', photographer: 'Museum of New Zealand Te Papa Tongarewa', page: 'https://unsplash.com/photos/hYiNCSyQnBY', name: 'Fleurs pêche' },
  'PP-F02': { id: 'photo-1581345331960-d1b0a223ef96', photographer: 'Birmingham Museums Trust', page: 'https://unsplash.com/photos/Bin0C2RtQpI', name: 'Oiseaux & fraises, fond bleu' },
  'PP-F03': { id: 'photo-1700607125510-59200dfc860b', photographer: 'Europeana', page: 'https://unsplash.com/photos/LfCD_R84AwY', name: 'Fleurs roses' },
  'PP-B01': { id: 'photo-1518714049508-96a3054cdaef', photographer: 'Bernard Hermant', page: 'https://unsplash.com/photos/OjwQ9WywGsw', name: 'Brique rouge' },
  'PP-B02': { id: 'photo-1531685250784-7569952593d2', photographer: 'Joe Woods', page: 'https://unsplash.com/photos/4Zaq5xY5M_c', name: 'Brique blanche' },
  'PP-B03': { id: 'photo-1553345723-5d0630e0886c', photographer: 'Mateusz Buda', page: 'https://unsplash.com/photos/UQ_0STgQpLY', name: 'Pierre grise' },
  'PP-G01': { id: 'photo-1768543903880-47ea21c68677', photographer: 'Monody Le', page: 'https://unsplash.com/photos/6fUaNVjrOxg', name: 'Éventails vert & or' },
  'PP-G02': { id: 'photo-1682588941907-e4143465019f', photographer: 'Museum of New Zealand Te Papa Tongarewa', page: 'https://unsplash.com/photos/VRC4Dai43s8', name: 'Géométrique noir & blanc' },
  'PP-G03': { id: 'photo-1681057575281-e6a14449e0c5', photographer: 'Museum of New Zealand Te Papa Tongarewa', page: 'https://unsplash.com/photos/M767QAcr494', name: 'Éventails corail' },
  'IN-F01': { id: 'photo-1701199993123-c56bc0f7270d', photographer: 'Thérèse Photo', page: 'https://unsplash.com/photos/L8GAsl76EJ8', name: 'Jardin anglais' },
  'IN-F02': { id: 'photo-1783764245463-9795eccd7279', photographer: 'The Metropolitan Museum of Art', page: 'https://unsplash.com/photos/dFu0FlkfHSo', name: 'Feuillage prune' },
  'IN-U01': { id: 'photo-1528458909336-e7a0adfed0a5', photographer: 'Annie Spratt', page: 'https://unsplash.com/photos/xTaOPMa6wAE', name: 'Lin naturel' },
  'IN-U02': { id: 'photo-1708894462826-ba3fa93b41b7', photographer: 'Hydra 4x', page: 'https://unsplash.com/photos/OL2tYVcApI4', name: 'Béton ciré' },
  'IN-U03': { id: 'photo-1763928801168-c4801758c5d0', photographer: 'Logan Voss', page: 'https://unsplash.com/photos/ZToHTyQO008', name: 'Lin doré' },
  'FM-01': { id: 'photo-1566041510394-cf7c8fe21800', photographer: 'Augustine Wong', page: 'https://unsplash.com/photos/li0iC0rjvvg', name: 'Calacatta blanc' },
  'FM-02': { id: 'photo-1550053808-52a75a05955d', photographer: 'Annie Spratt', page: 'https://unsplash.com/photos/osuiatBDTww', name: 'Noir Marquina' },
  'FM-03': { id: 'photo-1786673208615-8847e4547cd4', photographer: 'Kier in Sight Archives', page: 'https://unsplash.com/photos/gcV1pm4L9zY', name: 'Quartzite bleu-vert' },
  'FM-04': { id: 'photo-1738664926431-7db0eecf2cbd', photographer: 'HW KIM', page: 'https://unsplash.com/photos/3GK-2hlgkt0', name: 'Marbre noir & cuivre' },
  'P3D-01': { id: 'photo-1695066380132-139a0f26743f', photographer: 'Leiada Krözjhen', page: 'https://unsplash.com/photos/caZpb3B7wkI', name: 'Pétales' },
  'P3D-02': { id: 'photo-1694843689085-a70e390fcb9c', photographer: 'Pawel Czerwinski', page: 'https://unsplash.com/photos/jgwvXn8DHRE', name: 'Origami' },
  'P3D-03': { id: 'photo-1765046255505-083da4b856c8', photographer: 'Olli Kilpi', page: 'https://unsplash.com/photos/K7EEEPFFjh0', name: 'Vagues' },
  'SOL-B01': { id: 'photo-1761053130711-2515ef532bb5', photographer: 'Alex Cooper', page: 'https://unsplash.com/photos/Kq8uV6tZM20', name: 'Chevrons chêne doré' },
  'SOL-B02': { id: 'photo-1732442170580-9dee8affccdd', photographer: 'Fabian Kleiser', page: 'https://unsplash.com/photos/7liOqG6916U', name: 'Parquet marqueté' },
  'SOL-B03': { id: 'photo-1761053133165-0f3acdaf1770', photographer: 'Alex Cooper', page: 'https://unsplash.com/photos/K6vkTjYciX8', name: 'Bâtons rompus clair' },
  'SOL-C01': { id: 'photo-1771843471340-7387d7d903ce', photographer: 'Aliya Sam', page: 'https://unsplash.com/photos/4OJtJo7Yqvg', name: 'Carreaux de ciment bleus' },
  'SOL-C02': { id: 'photo-1764670281751-8b7874d2d85f', photographer: 'Tsuyoshi Kozu', page: 'https://unsplash.com/photos/MlwjEewV86s', name: 'Damier noir & blanc' },
  'FC-01': { id: 'photo-1762380371806-1ab2a0984502', photographer: 'Bernd Dittrich', page: 'https://unsplash.com/photos/zR11Ofb1mxs', name: 'Zellige multicolore' },
  'FC-02': { id: 'photo-1767306683850-21a7a8f00361', photographer: 'olga safronova', page: 'https://unsplash.com/photos/SKBw_hsdnkw', name: 'Carreaux géométriques' },
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

  /** Téléchargement avec nouvelles tentatives (connexion parfois instable). */
  const download = async (url: string, tries = 4): Promise<Response> => {
    for (let i = 1; ; i++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
        if (res.ok) return res
        if (i >= tries) throw new Error(`HTTP ${res.status}`)
      } catch (err) {
        if (i >= tries) throw err
      }
      await new Promise((r) => setTimeout(r, 2000 * i))
    }
  }

  const upload = async (p: Photo, width?: number) => {
    const res = await download(unsplash(p.id, width)).catch((err: unknown) => {
      throw new Error(`Téléchargement impossible : ${p.id} (${err instanceof Error ? err.message : err})`)
    })
    const asset = await client.assets.upload('image', Buffer.from(await res.arrayBuffer()), {
      filename: `${p.id}.jpg`,
      creditLine: `${p.photographer} / Unsplash`,
      source: { name: 'unsplash', id: p.id, url: p.page },
    })
    process.stdout.write('.')
    return asset._id
  }

  console.log('→ Photos du carrousel…')
  const slides: { _key: string; _type: 'image'; asset: { _type: 'reference'; _ref: string }; caption: string; alt: string }[] = []
  for (const [i, p] of HERO.entries()) {
    slides.push({ _key: `slide${i}`, _type: 'image', asset: { _type: 'reference', _ref: await upload(p) }, caption: p.caption, alt: p.alt })
  }
  console.log('\n→ Photos des catégories…')
  const tx = client.transaction()
  tx.createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings', shopName: 'Revêt & Déco' })
  tx.patch('siteSettings', (p) => p.set({ heroSlides: slides }))
  for (const [slug, photo] of Object.entries(CATEGORIES)) {
    const assetId = await upload(photo)
    const ids = await client.fetch<string[]>(`*[_type == "category" && slug.current == $slug]._id`, { slug })
    for (const id of ids) tx.patch(id, (p) => p.set({ image: { _type: 'image', asset: { _type: 'reference', _ref: assetId } } }))
  }
  console.log('\n→ Photos des produits…')
  for (const [slug, photo] of Object.entries(PRODUCTS)) {
    const assetId = await upload(photo)
    const ids = await client.fetch<string[]>(`*[_type == "product" && slug.current == $slug]._id`, { slug })
    for (const id of ids) tx.patch(id, (p) => p.set({ mainImage: { _type: 'image', asset: { _type: 'reference', _ref: assetId } } }))
  }
  console.log('\n→ Photos des motifs…')
  for (const [code, photo] of Object.entries(PATTERNS)) {
    const assetId = await upload(photo, 1000)
    const ids = await client.fetch<string[]>(`*[_type == "pattern" && code == $code]._id`, { code })
    for (const id of ids) {
      // Remplace seulement la 1re photo (principale) ; les photos suivantes ajoutées dans le Studio sont gardées.
      const main = { _key: 'p0', _type: 'image', asset: { _type: 'reference', _ref: assetId } }
      tx.patch(id, (p) => p.set({ name: photo.name }).setIfMissing({ photos: [] }).unset(['photos[_key=="p0"]']).prepend('photos', [main]))
    }
  }
  await tx.commit()
  console.log(
    `\n✓ ${HERO.length} photos de carrousel, ${Object.keys(CATEGORIES).length} de catégories, ${Object.keys(PRODUCTS).length} de produits et ${Object.keys(PATTERNS).length} de motifs en place.`,
  )
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err)
  process.exit(1)
})
