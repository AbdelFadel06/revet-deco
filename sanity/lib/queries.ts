import { defineQuery } from 'next-sanity'

/**
 * Toutes les requêtes GROQ du site. Ne pas écrire de GROQ dans les composants.
 * Après modification : `npm run typegen` pour régénérer `sanity/types.ts`.
 */

// --- Fragments --------------------------------------------------------------

/** Image avec LQIP (placeholder flou) et dimensions pour next/image. */
const IMAGE = /* groq */ `
  asset,
  crop,
  hotspot,
  "lqip": asset->metadata.lqip,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height
`

/** Données de prix nécessaires à `lib/pricing.ts`. */
const PRODUCT_PRICING = /* groq */ `
  _id,
  title,
  unit,
  "priceTiers": coalesce(priceTiers[]{minQty, unitPrice}, []),
  priceRange,
  "hasPatterns": coalesce(hasPatterns, false),
  "availability": coalesce(availability, "disponible")
`

const PRODUCT_CARD = /* groq */ `
  ${PRODUCT_PRICING},
  "slug": slug.current,
  "categorySlug": category->slug.current,
  shortDescription,
  dimensions,
  "features": coalesce(features, []),
  "mainImage": mainImage{${IMAGE}},
  "patternCount": count(*[_type == "pattern" && product._ref == ^._id])
`

const PATTERN_CARD = /* groq */ `
  _id,
  code,
  name,
  "availability": coalesce(availability, "disponible"),
  priceOverride,
  "productId": product._ref,
  "image": image{${IMAGE}},
  "roomImage": roomImage{${IMAGE}}
`

/** Catégorie visible = isVisible absent ou vrai. */
const VISIBLE_CATEGORY = /* groq */ `_type == "category" && isVisible != false && defined(slug.current)`

// --- Réglages & navigation ------------------------------------------------

export const SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    "shopName": coalesce(shopName, "Revêt & Déco"),
    "tagline": coalesce(tagline, "La rénovation à petit budget"),
    whatsappNumber,
    address,
    openingHours,
    mapUrl,
    socials,
    announcement,
    "defaultWasteMargin": coalesce(defaultWasteMargin, 0.1)
  }
`)

export const NAV_CATEGORIES_QUERY = defineQuery(`
  *[${VISIBLE_CATEGORY}] | order(order asc, title asc){
    _id,
    title,
    "label": coalesce(navLabel, title),
    "products": *[_type == "product" && category._ref == ^._id && defined(slug.current)] | order(order asc, title asc){
      _id,
      title,
      "slug": slug.current
    },
    "slug": slug.current,
    "isSeasonal": coalesce(isSeasonal, false)
  }
`)

// --- Accueil ---------------------------------------------------------------

export const HOME_QUERY = defineQuery(`{
  "whyUsImage": *[_type == "siteSettings"][0].whyUsImage{${IMAGE}, alt},
  "heroSlides": coalesce(*[_type == "siteSettings"][0].heroSlides[]{
    _key,
    _type,
    caption,
    alt,
    _type == "image" => { ${IMAGE} },
    _type == "heroVideo" => {
      "mp4": mp4.asset->url,
      "av1": av1.asset->url,
      "poster": poster{${IMAGE}}
    }
  }, []),
  "categories": *[${VISIBLE_CATEGORY}] | order(order asc, title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    "isSeasonal": coalesce(isSeasonal, false),
    "image": image{${IMAGE}},
    "productCount": count(*[_type == "product" && category._ref == ^._id])
  },
  "featuredProducts": *[_type == "product" && isFeatured == true && category->isVisible != false]
    | order(order asc, title asc)[0...16]{${PRODUCT_CARD}},
  "featuredPatterns": *[_type == "pattern" && isFeatured == true && availability != "epuise"]
    | order(code asc)[0...24]{
      ${PATTERN_CARD},
      "productSlug": product->slug.current,
      "categorySlug": product->category->slug.current,
      "familySlug": family->slug.current
    }
}`)

// --- Catégorie -------------------------------------------------------------

export const CATEGORY_QUERY = defineQuery(`
  *[${VISIBLE_CATEGORY} && slug.current == $category][0]{
    _id,
    title,
    "slug": slug.current,
    description,
    "image": image{${IMAGE}},
    "products": *[_type == "product" && category._ref == ^._id] | order(order asc, title asc){
      ${PRODUCT_CARD}
    }
  }
`)

export const CATEGORY_SLUGS_QUERY = defineQuery(`
  *[${VISIBLE_CATEGORY}]{ "category": slug.current }
`)

// --- Produit ---------------------------------------------------------------

export const PRODUCT_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $product && category->slug.current == $category && category->isVisible != false][0]{
    ${PRODUCT_CARD},
    "category": category->{title, "slug": slug.current},
    description,
    installTips,
    coveragePerUnit,
    wasteMargin,
    "gallery": gallery[]{${IMAGE}, caption},
    "families": *[_type == "patternFamily" && product._ref == ^._id] | order(order asc, title asc){
      _id,
      title,
      "slug": slug.current,
      "coverImage": coalesce(
        coverImage,
        *[_type == "pattern" && family._ref == ^._id] | order(code asc)[0].image
      ){${IMAGE}},
      "patternCount": count(*[_type == "pattern" && family._ref == ^._id])
    },
    "patterns": *[_type == "pattern" && product._ref == ^._id] | order(family->order asc, code asc){
      ${PATTERN_CARD},
      "familySlug": family->slug.current
    }
  }
`)

export const PRODUCT_PATHS_QUERY = defineQuery(`
  *[_type == "product" && defined(slug.current) && category->isVisible != false]{
    "category": category->slug.current,
    "product": slug.current
  }
`)

// --- Famille de motifs -----------------------------------------------------

export const FAMILY_QUERY = defineQuery(`
  *[_type == "patternFamily" && slug.current == $family
    && product->slug.current == $product
    && product->category->slug.current == $category][0]{
    _id,
    title,
    "slug": slug.current,
    "product": product->{
      ${PRODUCT_PRICING},
      "slug": slug.current,
      dimensions,
      "features": coalesce(features, []),
      coveragePerUnit,
      "category": category->{title, "slug": slug.current}
    },
    "otherFamilies": *[_type == "patternFamily" && product._ref == ^.product._ref && _id != ^._id]
      | order(order asc, title asc){ title, "slug": slug.current },
    "patterns": *[_type == "pattern" && family._ref == ^._id] | order(code asc){${PATTERN_CARD}}
  }
`)

export const FAMILY_PATHS_QUERY = defineQuery(`
  *[_type == "patternFamily" && defined(slug.current) && product->category->isVisible != false]{
    "category": product->category->slug.current,
    "product": product->slug.current,
    "family": slug.current
  }
`)

// --- Recherche -------------------------------------------------------------

/**
 * $term : saisie brute (« M12 », « marbre »…), $code : saisie normalisée
 * en majuscules. `match` découpe sur les tirets : « M12 » trouve « PP-M12 ».
 */
export const SEARCH_QUERY = defineQuery(`{
  "patterns": *[_type == "pattern" && (code == $code || code match $term || name match $term)]
    | order(code asc)[0...48]{
      ${PATTERN_CARD},
      "productTitle": product->title,
      "productSlug": product->slug.current,
      "categorySlug": product->category->slug.current,
      "familySlug": family->slug.current
    },
  "products": *[_type == "product" && category->isVisible != false && (title match $term || shortDescription match $term)]
    | order(order asc)[0...12]{${PRODUCT_CARD}}
}`)

// --- Panier ----------------------------------------------------------------

/** Données actuelles pour recalculer le panier (les prix ne viennent jamais du localStorage). */
export const CART_CATALOG_QUERY = defineQuery(`{
  "products": *[_type == "product" && _id in $productIds]{
    ${PRODUCT_PRICING},
    "slug": slug.current,
    "categorySlug": category->slug.current,
    "mainImage": mainImage{${IMAGE}}
  },
  "patterns": *[_type == "pattern" && code in $codes]{
    ${PATTERN_CARD},
    "familySlug": family->slug.current
  }
}`)
