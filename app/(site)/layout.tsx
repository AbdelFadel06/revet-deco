import { CartHydrator } from '@/components/cart/CartHydrator'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { MobileCartBar } from '@/components/layout/MobileCartBar'
import { NavigationTracker } from '@/components/layout/NavigationTracker'
import { Toaster } from '@/components/ui/Toaster'
import { QuestionButton } from '@/components/layout/QuestionButton'
import { buildQuestionUrl, WHATSAPP_NUMBER_REGEX } from '@/lib/whatsapp'
import { getSettings } from '@/sanity/lib/data'

export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSettings()
  const shopName = settings?.shopName ?? 'Revêt & Déco'
  const number = settings?.whatsappNumber
  const questionUrl =
    number && WHATSAPP_NUMBER_REGEX.test(number) ? buildQuestionUrl({ shopName, whatsappNumber: number }) : null
  const announcement = settings?.announcement?.active && settings.announcement.text ? settings.announcement.text : null

  return (
    <>
      <CartHydrator />
      <NavigationTracker />
      {announcement && (
        <div className="bg-gold-400 px-4 py-2 text-center text-sm font-medium text-brown-900">{announcement}</div>
      )}
      <Header
        shopName={shopName}
        contact={{
          whatsappNumber: number && WHATSAPP_NUMBER_REGEX.test(number) ? number : null,
          tiktok: settings?.socials?.tiktok ?? null,
          tagline: settings?.tagline ?? null,
        }}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer settings={settings} />
      <MobileCartBar />
      <Toaster />
      {questionUrl && <QuestionButton href={questionUrl} />}
    </>
  )
}
