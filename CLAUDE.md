# CLAUDE.md — Revêt & Déco · Site catalogue e-commerce

> Ce fichier résume le projet pour tout assistant de code (Claude) ou développeur qui rejoint le projet.
> Lis-le en entier avant d'écrire du code. En cas de doute sur une règle métier, demande avant de supposer.

---

## 1. Le projet en bref

**Revêt & Déco** est une boutique de décoration et rénovation (Bénin, prix en **FCFA**).
Slogan : **« La rénovation à petit budget »**.

On construit un **site catalogue avec panier**, **sans paiement en ligne** :

1. Le client parcourt le catalogue sur son téléphone.
2. Il ajoute des articles au panier (avec le **code du motif** quand il y en a un).
3. Il clique sur **« Commander sur WhatsApp »** : WhatsApp s'ouvre avec un message déjà rédigé (articles, codes, quantités, total estimé).
4. Le vendeur confirme la **disponibilité**, le **total** et le **paiement** sur WhatsApp.

### Ce que le site n'est PAS (phase 1)
- Pas de paiement en ligne.
- Pas de comptes clients.
- Pas de quantités en stock affichées. Le stock réel est peu fiable (ventes notées sur papier, saisies dans l'app **Shopm** tous les 1 à 2 jours, pas d'inventaire récent, certains stocks négatifs).
- Pas de synchronisation avec Shopm pour l'instant (prévue plus tard, voir §10).

Le site doit toujours dire **« Disponibilité confirmée sur WhatsApp »**. Il ne promet jamais qu'un article est en stock.

---

## 2. Stack technique

| Élément | Choix |
|---|---|
| Framework | **Next.js** (App Router, TypeScript, Server Components par défaut) |
| CMS / back-office | **Sanity** (Studio intégré sur `/studio` via `next-sanity`) |
| Requêtes | **GROQ** + `next-sanity` client, types générés avec **Sanity TypeGen** |
| Images | CDN Sanity + `@sanity/image-url` + `next/image` |
| Style | **Tailwind CSS** (tokens de marque dans la config, voir §8) |
| Panier | **Zustand** avec `persist` (localStorage), clé `rd-cart-v1` |
| Revalidation | Webhook Sanity → `POST /api/revalidate` → `revalidateTag()` |
| Analytics | Plausible ou Umami + événement `whatsapp_click` |
| Hébergement | Netlify ou Cloudflare Pages (le plan Hobby de Vercel est réservé à un usage **non commercial**, donc Vercel Pro si on choisit Vercel) |

**Pas de backend ni de base de données dédiés en phase 1.** Sanity sert de back-office, et les routes API Next.js suffisent pour les petits besoins serveur (revalidation, plus tard enregistrement des demandes et synchronisation Shopm).

### Variables d'environnement
```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_API_READ_TOKEN=          # seulement si dataset privé / preview
SANITY_REVALIDATE_SECRET=       # secret du webhook
SANITY_API_WRITE_TOKEN=         # uniquement pour le script d'import, jamais côté client
```
Le numéro WhatsApp n'est **pas** dans le `.env` : il est dans `siteSettings` (Sanity), pour que le client puisse le changer.

---

## 3. Catalogue : ce que vend la boutique

### Catégories (niveau 1)
| Catégorie | Produits |
|---|---|
| **Murs** | Papier peint autocollant, papier peint intissé (non autocollant), feuilles marbrées (plusieurs formats), panneaux 3D, tasseaux, autocollants image, pustone |
| **Sols** | Revêtement PVC, faux carreaux, plancher à clic, lamelles |
| **Plafonds** | Faux staff |
| **Peinture & finitions** | Sprays de peinture, rubans décoratifs |
| **Noël** *(saisonnière)* | Sapins / arbres, fleurs, boules de Noël |

La catégorie Noël doit pouvoir être **mise en avant ou masquée** depuis le Studio (`isSeasonal` + `isVisible`).

### Prix connus
| Produit | Unité | Prix |
|---|---|---|
| Papier peint autocollant | Rouleau **5 m × 60 cm** (= **3 m²**) | **2 500 F** l'unité, **2 000 F dès 6 rouleaux** |
| Papier peint intissé | Rouleau | **4 000 à 7 000 F** selon le motif |
| Autres | — | À fournir par le client |

---

## 4. Règles métier (à respecter strictement)

### 4.1 Motifs et codes
- Beaucoup de produits ont **des dizaines de motifs**, chacun avec un **code unique** (ex. `PP-M12`). C'est le cas du papier peint, des feuilles marbrées, des autocollants image et des panneaux 3D.
- Le **code motif** est l'identifiant que le vendeur utilise. Il doit apparaître partout : vignette, panier, message WhatsApp.
- Les motifs sont regroupés en **familles de motifs** (ressemblance visuelle) :
  - Marbre (blanc/or, rose/or, blanc/noir…)
  - Lambris / effet bois à lattes (chêne clair, orange, gris, noir, terracotta…)
  - Bois
  - Floral
  - Géométrique / Art déco
  - Brique & pierre
  - Uni & texturé
  - Enfants
  *(liste indicative, gérée dans Sanity)*

### 4.2 Navigation (décidée le 2026-11-18)
1. **Catégorie** (ex. « Revêtement mural ») → grille des produits.
2. **Page produit** (ex. « Papier peint autocollant ») → **tous les motifs directement**, avec des boutons de **famille** pour filtrer (Tous · Marbre · Lambris…). Chaque vignette : photo + **code** bien lisible + nom + prix + badge de disponibilité.
3. Toucher un motif ouvre une **fenêtre** (bottom sheet sur mobile) : grande photo, code, caractéristiques du produit, prix avec palier, quantité, « Ajouter ».
- La famille filtrée et le motif ouvert sont dans l'URL (`?famille=marbre#PP-M12`) : liens partageables.
- Les **caractéristiques** (`features` sur le produit, ex. « 5 m × 60 cm (3 m²) », « Autocollant », « Imperméable ») s'affichent sur le produit et sur chaque motif.
- Une **recherche par code** est obligatoire : taper `M12` ou `PP-M12` mène directement au motif.

### 4.3 Disponibilité
Trois états seulement, modifiables par le client dans le Studio :
- `disponible` → pas de badge, ou un badge discret « Disponible »
- `sur_commande` → badge « Sur commande »
- `epuise` → vignette **grisée** avec « Épuisé ». Le motif reste **visible** mais ne peut pas être ajouté au panier.

On n'affiche **jamais** de quantité en stock.

### 4.4 Prix dégressifs (paliers)
- Chaque produit possède un tableau `priceTiers` : `[{ minQty: 1, unitPrice: 2500 }, { minQty: 6, unitPrice: 2000 }]`.
- **Le palier se calcule sur la quantité TOTALE du produit dans le panier, tous motifs confondus.** Exemple : 4 × Marbre + 2 × Bois = 6 rouleaux → 2 000 F chacun → 12 000 F.
  ⚠️ *Règle à confirmer avec le client.* Elle doit rester facile à changer (fonction `getUnitPrice()` isolée).
- Un motif peut avoir un `priceOverride`, utilisé pour l'intissé dont le prix varie par motif.
- Le panier affiche l'économie réalisée (« Vous économisez 3 000 F ») et une incitation (« Plus que 2 rouleaux pour passer à 2 000 F l'unité »).
- Ne jamais coder `6` ou `2000` en dur.

### 4.5 Calculateur de quantité
- Sur les produits qui ont `coveragePerUnit` (m² couverts par unité) :
  - Murs : largeur × hauteur (m), moins les ouvertures (optionnel)
  - Sols / plafonds : longueur × largeur (m)
  - `unités = ceil( surface × (1 + marge) / coveragePerUnit )`, avec une marge par défaut de **10 %** (`wasteMargin` modifiable par produit)
- Papier peint autocollant : `coveragePerUnit = 3` (5 m × 0,6 m).
- Bouton « Ajouter X rouleaux au panier ».
- Afficher que c'est une **estimation**.

### 4.6 Message WhatsApp
- Lien : `https://wa.me/<numero>?text=<encodeURIComponent(message)>`
- Numéro au format international **sans `+` ni espaces** : `229` + numéro béninois à 10 chiffres (`01XXXXXXXX`), par exemple `22901XXXXXXXX`.
- Format du message :
```
Bonjour Revêt & Déco 👋
Je souhaite commander :

• Papier peint autocollant
  - PP-M12 (Marbre blanc & or) × 4
  - PP-L03 (Lambris chêne clair) × 2
  → 6 rouleaux × 2 000 F = 12 000 F

• Spray peinture or × 2 → 3 000 F

Total estimé : 15 000 F
(Disponibilité et total à confirmer)
```
- **Pas de nom ni de quartier** dans le message ni dans le panier (décision du 2026-11-24) : l'équipe les demande dans la conversation au moment du paiement et de la livraison, pour ne pas freiner l'envoi.
- Le message doit rester lisible si le panier est long. Au-delà d'environ 1 500 caractères, abréger les noms et garder les codes.
- Envoyer l'événement analytics `whatsapp_click` avec le nombre d'articles et le total.
- Ne pas vider le panier automatiquement après le clic. Proposer « Vider le panier » ensuite.

---

## 5. Schémas Sanity

Fichiers dans `sanity/schemaTypes/`. Tous les libellés du Studio sont **en français**. Le Studio doit rester simple pour un commerçant : cacher les champs techniques dans un groupe « Avancé ».

### `siteSettings` (singleton)
- `shopName`, `tagline`
- `whatsappNumber` (string, validation regex `^229\d{10}$`)
- `address`, `openingHours`, `mapUrl`
- `socials` (Facebook, Instagram, TikTok)
- `announcement` (bandeau en haut du site : texte + actif oui/non)
- `defaultWasteMargin` (nombre, défaut 0,10)

### `category`
- `title`, `slug`, `description`, `image`, `order`
- `isSeasonal` (bool), `isVisible` (bool)

### `product`
- `title`, `slug`, `category` → ref `category`
- `shortDescription`, `description` (portable text)
- `mainImage`, `gallery[]` (photos posées / avant-après en priorité)
- `unit` : `rouleau | m2 | paquet | piece | feuille | bombe | metre`
- `dimensions` (texte, ex. « 5 m × 60 cm »)
- `coveragePerUnit` (nombre, m², optionnel → active le calculateur)
- `wasteMargin` (optionnel, sinon valeur de `siteSettings`)
- `priceTiers[]` : `{ minQty: number, unitPrice: number }` (validation : trié, premier `minQty = 1`)
- `priceRange` : `{ min, max }` (optionnel, pour afficher « 4 000 – 7 000 F »)
- `hasPatterns` (bool)
- `installTips` (portable text, conseils de pose)
- `isFeatured`, `order`
- `availability` (même enum que les motifs, utilisé si `hasPatterns = false`)
- `shopmRef` (string, groupe Avancé, pour la future synchro)

### `patternFamily`
- `title`, `slug`, `product` → ref `product`
- `coverImage`, `order`

### `pattern`
- `code` (string, **unique, requis**, en majuscules), validation d'unicité via un validateur custom
- `name` (ex. « Marbre blanc & or »)
- `product` → ref `product`, `family` → ref `patternFamily`
- `image` (photo à plat, requise), `roomImage` (photo posée, optionnelle)
- `availability` : `disponible | sur_commande | epuise` (défaut `disponible`)
- `priceOverride` (optionnel)
- `isFeatured`
- `shopmRef` (Avancé)
- Aperçu dans le Studio : `code — name` + image + couleur selon la disponibilité

### Structure du Studio (Structure Builder)
```
Revêt & Déco
├─ ⚙️ Réglages du site
├─ 📂 Catégories
├─ 📦 Produits
├─ 🎨 Motifs
│   ├─ Par produit → Par famille
│   └─ Tous les motifs épuisés   ← vue filtrée, pratique au quotidien
└─ 🗂️ Familles de motifs
```
Prévoir une **action rapide** (document action) pour changer la disponibilité d'un motif en un clic.

---

## 6. Import initial des données

Saisir des centaines de motifs à la main est irréaliste. On importe depuis un tableau :

`data/motifs.csv` (ou .xlsx) : `code, produit, famille, nom, disponibilite, prix_override, shopm_ref`
Photos : `data/photos/<CODE>.jpg` (le nom du fichier = le code du motif).

Script `scripts/import.ts` :
1. Lit le CSV.
2. Crée ou met à jour les `product`, `patternFamily` et `pattern` (IDs déterministes : `pattern-<code>`, `family-<slug>`). Le script est **idempotent** et peut être relancé.
3. Uploade les images via le client Sanity (`assets.upload`) et les associe par code.
4. Produit un rapport : motifs sans photo, photos sans motif, codes en double.

Utilise `SANITY_API_WRITE_TOKEN` (jamais exposé au client).

---

## 7. Pages et routes

```
app/
├─ (site)/
│  ├─ page.tsx                          # Accueil : hero, catégories, mises en avant, Noël (saisonnier)
│  ├─ [category]/page.tsx               # Liste des produits de la catégorie
│  ├─ [category]/[product]/page.tsx     # Produit : tous les motifs + filtres famille, OU fiche simple + calculateur
│  ├─ recherche/page.tsx                # Recherche par nom ou code motif
│  ├─ panier/page.tsx                   # Panier + bouton WhatsApp
│  └─ a-propos/page.tsx                 # Boutique, adresse, horaires, carte
├─ studio/[[...tool]]/page.tsx          # Sanity Studio
└─ api/revalidate/route.ts              # Webhook Sanity (vérifie la signature)
```
- Utiliser `generateStaticParams` + `revalidateTag` par type de document.
- Le panier est accessible partout : icône dans l'en-tête avec compteur, et **barre fixe en bas sur mobile** (« 3 articles · 7 500 F · Voir le panier »).
- Un bouton WhatsApp flottant « Une question ? » ouvre une conversation simple, sans panier.

---

## 8. Identité visuelle

Inspirée du logo et de la boutique réelle (rouleaux de marbre blanc veiné d'or, lambris effet bois à lattes, tons chauds terracotta, orange, gris et noir).

### Couleurs (approximatives, à affiner avec le fichier du logo)
| Token | Hex | Usage |
|---|---|---|
| `brown-900` (espresso) | `#40200C` | Fond principal du logo, en-tête, pied de page, sections fortes |
| `brown-700` | `#5A3219` | Survols, cartes sur fond sombre |
| `gold-400` (caramel doré) | `#C69C6D` | Logo, titres sur fond sombre, accents, boutons secondaires |
| `gold-200` | `#E6CFAE` | Bordures fines, séparateurs |
| `cream-50` | `#FAF6F0` | Fond des pages catalogue (les motifs doivent ressortir) |
| `ink-900` | `#1F140C` | Texte principal sur fond clair |
| `whatsapp` | `#25D366` | **Uniquement** pour le bouton « Commander sur WhatsApp » |
| `status-ok / warn / out` | vert sourd / ambre / gris | Badges de disponibilité |

Décisions du 2026-11-18 (demande de la boutique) :
- **Fond des pages en blanc** (`#ffffff`) pour un rendu plus luxueux ; `cream-50` reste pour les accents.
- **En-tête** (révisé le 2026-11-23) : « Revêt & Déco » à gauche ; à droite les liens courts (Mur · Sol · Plafond · Déco · Noël, champ `navLabel`) et le **chariot**. Mobile : **menu burger** avec sous-menus par catégorie (produits). Transparent sur les photos du hero ; quand il prend un fond, il reprend les **couleurs du footer** (brun espresso, logo or, liens crème).
- **Pied de page** : nom + slogan, téléphone, WhatsApp, TikTok, adresse écrite + bouton « Voir sur la carte » (champs `address` et `mapUrl`), et le texte « Commander ». Pas de mentions « Prix en FCFA / Disponibilité… » dans le pied.
- **Hero = carrousel pleine largeur** des réalisations (`siteSettings.heroSlides`, modifiable dans le Studio), grand titre en majuscules, bouton blanc arrondi.
- **Vidéos du hero** (2026-11-24) : clips courts (5 à 8 s), sans son, sans la page de fin Instagram. Encodage avec `media-source/encode.sh` : AV1 (`libsvtav1`, CRF 33) + H.264 (`libopenh264`, 2,6 Mb/s) + image d'attente ; qualité vérifiée par SSIM ≥ 0,98. Envoi dans Sanity avec `npm run media:boutique`. Les filigranes des créateurs (autorisation obtenue par la boutique) sont **conservés**. Vidéos verticales : plein écran sur mobile, cadre vertical à droite sur ordinateur.
- **Section « Pourquoi nous choisir »** (7 prestations) après les produits ; photo dans `siteSettings.whyUsImage`.
- **Coups de cœur et incontournables** : toujours un nombre pair (`evenSlice`), 4 affichés puis « Voir plus ».
- **Catégories** : cartes photo au format paysage, nom posé sur l'image. **Cartes produits** : même taille partout, photo + nom + prix uniquement.

Principe : **les produits sont colorés, donc l'interface reste sobre.** Les grilles de motifs sont sur fond crème ou blanc, et le brun et l'or encadrent la page (en-tête, pied, hero).

### Typographie
- **Titres** : serif élégant à fort contraste, proche du logo, par exemple *Gloock*, *Cormorant Garamond* ou *Playfair Display* (Google Fonts, via `next/font`).
- **Texte et interface** : sans-serif ronde et lisible, proche du slogan, par exemple *Outfit*, *Jost* ou *Nunito Sans*.
- **Codes motif** : la même sans-serif en `font-semibold` avec `tracking-wide`, ou une mono discrète. Le code doit être très lisible.

### Éléments graphiques
- Le **cadre ovale / arche** du logo peut servir de motif récurrent : masque arrondi en haut sur les images de catégories, badge.
- Filets fins dorés (1px `gold-400`) plutôt que des ombres lourdes.
- Coins légèrement arrondis (`rounded-lg`), pas d'effets brillants.
- Logo dans `public/brand/` (version claire sur fond sombre, version sombre sur fond clair, monogramme R&D seul pour le favicon).

### Ton éditorial
Français simple, chaleureux, orienté « petit budget, grand effet ». Exemples : « Transformez votre salon pour moins de 20 000 F », « Sans colle, sans travaux ».

---

## 9. Performance, mobile, accessibilité

- **Mobile d'abord.** La majorité des clients sont sur téléphone, avec parfois une connexion moyenne.
- Images : `next/image` avec `sizes` correct, qualité 70 à 75, placeholder `blur` (LQIP Sanity). Les vignettes de motifs ne doivent pas dépasser environ 400 px de large.
- Grilles (catégories, produits, motifs) : 2 colonnes sur mobile, 3 sur tablette, **4 sur desktop** (décision du 2026-11-19).
- Pagination ou chargement progressif au-delà de 40 motifs.
- Cibles tactiles d'au moins 44 px, contrastes AA (attention à l'or sur crème : utiliser `brown-900` pour le texte sur fond clair).
- SEO : métadonnées par page, Open Graph avec l'image du produit (partage WhatsApp et Facebook), `sitemap.xml`, données structurées `Product` **sans** `availability` exacte.

---

## 10. Feuille de route

| Phase | Contenu |
|---|---|
| **1 — Lancement** | Schémas Sanity, import CSV, catalogue à 2 niveaux, recherche par code, panier avec paliers, calculateur, message WhatsApp, Studio simplifié |
| **2** | Route `POST /api/demande` qui enregistre le panier envoyé (document `orderRequest` dans Sanity) avant d'ouvrir WhatsApp, pour les statistiques (motifs les plus demandés). Page « Réalisations » avant/après |
| **3** | Synchronisation **Shopm → Sanity** (cron ou route planifiée) qui met à jour `availability` via `shopmRef`, **seulement après un inventaire complet** |
| **4 (option)** | Paiement Mobile Money (FedaPay / Kkiapay), comptes clients, suivi de commande. Un vrai backend devient nécessaire à ce stade |

Dès la phase 1, chaque produit et chaque motif doit avoir un champ `shopmRef` pour préparer la phase 3.

---

## 11. Conventions de code

- TypeScript strict, pas de `any`.
- Logique métier **pure et testée** dans `lib/` :
  - `lib/pricing.ts` → `getUnitPrice(product, totalQty, pattern?)`, `getCartTotals(cart, catalog)`
  - `lib/calculator.ts` → `unitsNeeded(surface, coverage, margin)`
  - `lib/whatsapp.ts` → `buildWhatsAppMessage(cart, settings)`, `buildWhatsAppUrl(...)`
  - Tests unitaires (Vitest) pour ces trois fichiers.
- Requêtes GROQ dans `sanity/lib/queries.ts`, typées avec TypeGen. Ne pas écrire de GROQ dans les composants.
- Le panier stocke `productId`, `patternCode` et `qty`. **Les prix sont recalculés** à partir des données actuelles, jamais repris tels quels du localStorage.
- Prix toujours formatés avec `Intl.NumberFormat('fr-FR')` + « F » (ex. `12 000 F`).
- Interface 100 % en français. Code (variables, fonctions) en anglais.
- Composants : `components/catalog/`, `components/cart/`, `components/ui/`.

---

## 12. Questions ouvertes (à confirmer avec le client)

- [x] Numéro WhatsApp de la boutique : 01 97 84 34 24 (`2290197843424`, saisi dans Sanity). TikTok : https://www.tiktok.com/@revet.deco
- [ ] Le palier « dès 6 » s'applique-t-il au total des rouleaux tous motifs confondus ? (hypothèse actuelle : oui)
- [ ] Format exact des codes motif existants (garder les codes actuels ou les renommer en `PP-M12`).
- [ ] Prix, unités et formats des autres produits (feuilles marbrées, sols, faux staff, panneaux 3D, tasseaux, pustone, sprays, rubans, articles de Noël).
- [ ] Les paliers existent-ils pour d'autres produits ?
- [ ] Adresse, horaires, réseaux sociaux, date d'ouverture.
- [ ] Fichiers sources du logo (SVG) et codes couleur exacts.
- [ ] Livraison : proposée ? Zones et frais à mentionner dans le message ?
