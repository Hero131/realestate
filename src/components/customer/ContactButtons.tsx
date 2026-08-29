import { telHref, whatsappHref } from '@/lib/customer'
import type { TenantBroker } from '@/lib/tenant'

type ContactButtonsProps = {
  broker: TenantBroker
  whatsappMessage?: string
  className?: string
}

export function ContactButtons({
  broker,
  whatsappMessage,
  className = '',
}: ContactButtonsProps) {
  const callLink = telHref(broker.phone)
  const chatLink = whatsappHref(broker.whatsapp, whatsappMessage)

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      {callLink ? (
        <a
          href={callLink}
          className="flex flex-1 items-center justify-center rounded-2xl bg-stone-900 px-6 py-4 text-xl font-semibold text-white hover:bg-stone-800"
        >
          Call
        </a>
      ) : (
        <span className="flex flex-1 items-center justify-center rounded-2xl bg-stone-200 px-6 py-4 text-xl font-medium text-stone-500">
          Call unavailable
        </span>
      )}

      {chatLink ? (
        <a
          href={chatLink}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center rounded-2xl border-2 border-green-600 bg-green-600 px-6 py-4 text-xl font-semibold text-white hover:bg-green-700"
        >
          WhatsApp
        </a>
      ) : (
        <span className="flex flex-1 items-center justify-center rounded-2xl border-2 border-stone-200 px-6 py-4 text-xl font-medium text-stone-500">
          WhatsApp unavailable
        </span>
      )}
    </div>
  )
}
