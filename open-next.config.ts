import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Configuration OpenNext pour Cloudflare Workers.
 * Démarrage sans R2 (pas de carte bancaire nécessaire). Pour un cache persistant
 * entre les déploiements, créer le bucket R2 puis décommenter :
 *
 *   import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
 *   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache })
 */
export default defineCloudflareConfig({})
