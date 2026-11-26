import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Revêt & Déco')
    .items([
      S.listItem()
        .title('Réglages du site')
        .id('siteSettings')
        .schemaType('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Réglages du site')),
      S.divider(),
      S.documentTypeListItem('category').title('Catégories'),
      S.documentTypeListItem('product').title('Produits'),
      S.listItem()
        .title('Motifs')
        .schemaType('pattern')
        .child(
          S.list()
            .title('Motifs')
            .items([
              S.listItem()
                .title('Par produit')
                .child(
                  S.documentTypeList('product')
                    .title('Choisir un produit')
                    .filter('_type == "product" && hasPatterns == true')
                    .child((productId) =>
                      S.list()
                        .title('Familles')
                        .items([
                          S.listItem()
                            .title('Tous les motifs du produit')
                            .child(
                              S.documentTypeList('pattern')
                                .title('Motifs')
                                .filter('_type == "pattern" && product._ref == $productId')
                                .params({ productId })
                                .defaultOrdering([{ field: 'code', direction: 'asc' }]),
                            ),
                          S.listItem()
                            .title('Par famille')
                            .child(
                              S.documentTypeList('patternFamily')
                                .title('Familles')
                                .filter('_type == "patternFamily" && product._ref == $productId')
                                .params({ productId })
                                .child((familyId) =>
                                  S.documentTypeList('pattern')
                                    .title('Motifs de la famille')
                                    .filter('_type == "pattern" && family._ref == $familyId')
                                    .params({ familyId })
                                    .defaultOrdering([{ field: 'code', direction: 'asc' }]),
                                ),
                            ),
                        ]),
                    ),
                ),
              S.listItem()
                .title('Tous les motifs épuisés')
                .child(
                  S.documentTypeList('pattern')
                    .title('Motifs épuisés')
                    .filter('_type == "pattern" && availability == "epuise"')
                    .defaultOrdering([{ field: 'code', direction: 'asc' }]),
                ),
              S.listItem()
                .title('Motifs sur commande')
                .child(
                  S.documentTypeList('pattern')
                    .title('Motifs sur commande')
                    .filter('_type == "pattern" && availability == "sur_commande"')
                    .defaultOrdering([{ field: 'code', direction: 'asc' }]),
                ),
              S.divider(),
              S.documentTypeListItem('pattern').title('Tous les motifs'),
            ]),
        ),
      S.documentTypeListItem('patternFamily').title('Familles de motifs'),
      S.divider(),
      S.listItem()
        .title('Réalisations')
        .schemaType('realisation')
        .child(
          S.documentTypeList('realisation')
            .title('Réalisations')
            .defaultOrdering([{ field: 'date', direction: 'desc' }]),
        ),
    ])
