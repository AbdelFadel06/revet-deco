import { getNavCategories } from '@/sanity/lib/data'
import { HeaderBar, type MenuContact } from './HeaderBar'

export async function Header({ shopName, contact }: { shopName: string; contact: MenuContact }) {
  const categories = await getNavCategories()
  const links = categories
    .filter((c): c is typeof c & { slug: string } => Boolean(c.slug))
    .map((c) => ({
      href: `/${c.slug}`,
      label: c.label ?? c.title ?? c.slug,
      title: c.title ?? c.slug,
      children: c.products
        .filter((p): p is typeof p & { slug: string } => Boolean(p.slug))
        .map((p) => ({ href: `/${c.slug}/${p.slug}`, label: p.title ?? p.slug })),
    }))
  return <HeaderBar shopName={shopName} links={links} contact={contact} />
}
