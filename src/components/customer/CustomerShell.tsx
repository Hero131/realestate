import { TenantProvider } from '@/contexts/TenantContext'
import { CustomerLayout } from '@/components/customer/CustomerLayout'

export function CustomerShell() {
  return (
    <TenantProvider>
      <CustomerLayout />
    </TenantProvider>
  )
}
