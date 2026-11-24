import { SanityImage, type SanityImageData } from '@/components/ui/SanityImage'

/** Prestations premium mises en avant (texte fixe, ton « petit budget, grand effet »). */
const POINTS: { title: string; text: string }[] = [
  { title: 'Simulation avant travaux', text: 'Visualisez le rendu de votre pièce avant de vous décider.' },
  { title: 'Assistance sur l’estimation', text: 'Nous calculons avec vous les quantités et le budget, sans gaspillage.' },
  { title: 'Pose de qualité', text: 'Une pose droite, soignée et durable, quel que soit le revêtement.' },
  { title: 'Projet déco de A à Z', text: 'Du choix des matériaux aux finitions, nous nous occupons de tout.' },
  { title: 'Résultat impeccable', text: 'Finitions nettes, raccords discrets et chantier rendu propre.' },
  { title: 'Expérience et diversité', text: 'Des centaines de motifs et de matériaux pour tous les styles et tous les budgets.' },
  { title: 'Une équipe efficace et bien formée', text: 'Des poseurs ponctuels, formés aux bonnes techniques de pose.' },
]

/**
 * Section « Pourquoi nous choisir » : photo d'un poseur à gauche (desktop),
 * liste des prestations à droite. Photo modifiable dans le Studio.
 */
export function WhyUs({ image }: { image: (SanityImageData & { alt?: string | null }) | null }) {
  return (
    <section className="mt-20 overflow-hidden bg-brown-900 text-cream-50" aria-labelledby="why-title">
      <div className="grid lg:grid-cols-[5fr_7fr]">
        <div className="relative aspect-4/3 lg:aspect-auto">
          <SanityImage
            image={image}
            alt={image?.alt ?? 'Un poseur de l’équipe sur un chantier'}
            sizes="(min-width: 1024px) 480px, 100vw"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-brown-900/60 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-brown-900/30" />
        </div>

        <div className="p-6 sm:p-10">
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gold-400">
            <span className="h-px w-8 bg-gold-400" aria-hidden />
            Nos prestations premium
          </p>
          <h2 id="why-title" className="mt-4 font-serif text-3xl text-gold-200 sm:text-4xl">
            Pourquoi nous choisir&nbsp;?
          </h2>
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {POINTS.map((p, i) => (
              // Nombre impair : le dernier point prend toute la largeur (pas d'orphelin).
              <li key={p.title} className={`flex gap-4 ${i === POINTS.length - 1 && POINTS.length % 2 ? 'sm:col-span-2' : ''}`}>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold-400 font-serif text-gold-400"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold text-cream-50">{p.title}</span>
                  <span className="mt-1 block text-sm text-cream-50/75">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
