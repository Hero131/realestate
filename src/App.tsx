import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/AdminLayout'
import { CustomerShell } from '@/components/customer/CustomerShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { CatalogPage } from '@/pages/customer/CatalogPage'
import { PropertyDetailsPage } from '@/pages/customer/PropertyDetailsPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { PropertyFormPage } from '@/pages/admin/PropertyFormPage'

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerShell />}>
        <Route index element={<CatalogPage />} />
        <Route path="properties/:id" element={<PropertyDetailsPage />} />
      </Route>

      <Route path="/admin/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="properties/new" element={<PropertyFormPage />} />
          <Route path="properties/:id/edit" element={<PropertyFormPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
