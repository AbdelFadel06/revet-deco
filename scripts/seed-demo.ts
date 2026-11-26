/**
 * Données de DÉMONSTRATION → Sanity.
 *
 *   npm run seed:demo           crée / met à jour le catalogue de démo
 *   npm run seed:demo -- --clean  supprime tous les documents de démo
 *
 * Tous les documents ont un _id préfixé par « demo- » : ils sont faciles à
 * supprimer avant d'importer le vrai catalogue (scripts/import.ts).
 * Le script est idempotent : on peut le relancer sans créer de doublons.
 *
 * Nécessite SANITY_API_WRITE_TOKEN dans .env.local (jamais côté client).
 */
import { createClient, type SanityClient } from '@sanity/client'
import { config } from 'dotenv'
import { categories, products, type DemoPattern } from './demo/data'
import { renderPattern, renderProductCard } from './demo/images'
import { renderScene } from './demo/scenes'

config({ path: '.env.local' })

const ID = {
  category: (slug: string) => `demo-category-${slug}`,
  product: (slug: string) => `demo-product-${slug}`,
  family: (product: string, slug: string) => `demo-family-${product}-${slug}`,
  pattern: (code: string) => `demo-pattern-${code.toLowerCase()}`,
}

function getClient(): SanityClient {
  const token = process.env.SANITY_API_WRITE_TOKEN
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  if (!token) {
    console.error(
      '✗ SANITY_API_WRITE_TOKEN manquant dans .env.local.\n' +
        '  Créez un jeton « Editor » sur sanity.io/manage → API → Tokens.',
    )
    process.exit(1)
  }
  if (!projectId || !dataset) {
    console.error('✗ NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET manquants.')
    process.exit(1)
  }
  return createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false })
}

const ref = (_ref: string) => ({ _type: 'reference' as const, _ref })
const image = (assetId: string) => ({ _type: 'image' as const, asset: ref(assetId) })
const slug = (current: string) => ({ _type: 'slug' as const, current })
const key = (i: number) => `k${i}`

/** Exécute `fn` sur `items` avec au plus `limit` tâches en parallèle. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
      }
    }),
  )
  return out
}

async function clean(client: SanityClient) {
  const ids = await client.fetch<string[]>(`*[string::startsWith(_id, "demo-") || string::startsWith(_id, "drafts.demo-")]._id`)
  if (ids.length === 0) return console.log('Aucun document de démo à supprimer.')
  // Ordre : motifs → familles → produits → catégories (respect des références).
  const order = ['pattern', 'family', 'product', 'category']
  const rank = (id: string) => order.findIndex((t) => id.includes(`demo-${t}-`))
  ids.sort((a, b) => rank(a) - rank(b))
  for (const t of order) {
    const batch = ids.filter((id) => id.includes(`demo-${t}-`))
    if (!batch.length) continue
    const tx = client.transaction()
    batch.forEach((id) => tx.delete(id))
    await tx.commit()
    console.log(`  − ${batch.length} ${t}`)
  }
  console.log(`✓ ${ids.length} documents de démo supprimés.`)
}

async function seed(client: SanityClient) {
  // 1. Images ---------------------------------------------------------------
  const assetByKey = new Map<string, string>()

  const allPatterns: (DemoPattern & { productSlug: string })[] = products.flatMap((p) =>
    (p.families ?? []).flatMap((f) => f.patterns.map((pat) => ({ ...pat, productSlug: p.slug }))),
  )

  console.log(`→ Génération et envoi de ${allPatterns.length} images de motifs…`)
  await pool(allPatterns, 4, async (pat) => {
    const buffer = await renderPattern(pat.code, pat.style)
    const asset = await client.assets.upload('image', buffer, { filename: `${pat.code}.jpg` })
    assetByKey.set(pat.code, asset._id)
    process.stdout.write('.')
  })
  process.stdout.write('\n')

  const simpleProducts = products.filter((p) => p.card)
  console.log(`→ Génération de ${simpleProducts.length} visuels produits…`)
  await pool(simpleProducts, 4, async (p) => {
    const c = p.card!
    const buffer = await renderProductCard(p.title, c.bg, c.fg, c.backdrop)
    const asset = await client.assets.upload('image', buffer, { filename: `${p.slug}.jpg` })
    assetByKey.set(p.slug, asset._id)
    process.stdout.write('.')
  })
  process.stdout.write('\n')

  console.log(`→ Génération de ${categories.length} scènes de catégories…`)
  await pool(categories, 3, async (c) => {
    const asset = await client.assets.upload('image', await renderScene(c.scene), { filename: `categorie-${c.slug}.jpg` })
    assetByKey.set(`scene:${c.slug}`, asset._id)
    process.stdout.write('.')
  })
  process.stdout.write('\n')

  // 2. Documents ------------------------------------------------------------
  const tx = client.transaction()

  // Réglages : on ne remplace PAS ce que la boutique a déjà saisi.
  tx.createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings', shopName: 'Revêt & Déco', tagline: 'La rénovation à petit budget', defaultWasteMargin: 0.1 })

  for (const c of categories) {
    const asset = assetByKey.get(`scene:${c.slug}`)
    tx.createOrReplace({
      _id: ID.category(c.slug),
      _type: 'category',
      title: c.title,
      navLabel: c.navLabel,
      slug: slug(c.slug),
      description: c.description,
      order: c.order,
      isVisible: true,
      isSeasonal: Boolean(c.isSeasonal),
      ...(asset ? { image: image(asset) } : {}),
    })
  }

  products.forEach((p, i) => {
    const firstCode = p.families?.[0]?.patterns[0]?.code
    const mainAsset = assetByKey.get(firstCode ?? p.slug)
    tx.createOrReplace({
      _id: ID.product(p.slug),
      _type: 'product',
      title: p.title,
      slug: slug(p.slug),
      category: ref(ID.category(p.category)),
      shortDescription: p.shortDescription,
      features: p.features,
      unit: p.unit,
      ...(p.dimensions ? { dimensions: p.dimensions } : {}),
      ...(p.coveragePerUnit ? { coveragePerUnit: p.coveragePerUnit } : {}),
      ...(p.priceRange ? { priceRange: p.priceRange } : {}),
      priceTiers: p.priceTiers.map((t, k) => ({ _key: key(k), _type: 'priceTier', ...t })),
      hasPatterns: Boolean(p.families?.length),
      availability: p.availability ?? 'disponible',
      isFeatured: Boolean(p.isFeatured),
      order: i + 1,
      ...(mainAsset ? { mainImage: image(mainAsset) } : {}),
    })

    p.families?.forEach((f, fi) => {
      const familyId = ID.family(p.slug, f.slug)
      tx.createOrReplace({
        _id: familyId,
        _type: 'patternFamily',
        title: f.title,
        slug: slug(f.slug),
        product: ref(ID.product(p.slug)),
        order: fi + 1,
      })
      for (const pat of f.patterns) {
        tx.createOrReplace({
          _id: ID.pattern(pat.code),
          _type: 'pattern',
          code: pat.code,
          name: pat.name,
          product: ref(ID.product(p.slug)),
          family: ref(familyId),
          photos: [{ ...image(assetByKey.get(pat.code)!), _key: 'p0' }],
          availability: pat.availability ?? 'disponible',
          isFeatured: Boolean(pat.isFeatured),
          ...(pat.priceOverride != null ? { priceOverride: pat.priceOverride } : {}),
        })
      }
    })
  })

  const result = await tx.commit({ visibility: 'sync' })
  const families = products.reduce((n, p) => n + (p.families?.length ?? 0), 0)
  console.log(
    `✓ ${result.results.length} écritures : ${categories.length} catégories, ${products.length} produits, ` +
      `${families} familles, ${allPatterns.length} motifs.`,
  )
}

async function main() {
  const client = getClient()
  if (process.argv.includes('--clean')) await clean(client)
  else await seed(client)
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err)
  process.exit(1)
})
