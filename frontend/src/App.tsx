import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './AuthContext'
import type { ReactNode } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import NewCampaign from './pages/NewCampaign'
import CampaignDetail from './pages/CampaignDetail'
import Assets from './pages/Assets'
import AudiencesPage from './pages/AudiencesPage'
import CopyPage from './pages/CopyPage'
import Integrations from './pages/Integrations'
import Reports from './pages/Reports'
import Leads from './pages/Leads'
import Billing from './pages/Billing'
import Pricing from './pages/Pricing'
import CheckoutSuccess from './pages/CheckoutSuccess'
import LandingPage from './pages/LandingPage'
import OAuthCallback from './pages/OAuthCallback'
import AdminPanel from './pages/AdminPanel'
import ResetPassword from './pages/ResetPassword'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">טוען...</div>
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (token) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                   element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login"              element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"           element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/pricing"            element={<Pricing />} />
      <Route path="/reset-password"     element={<ResetPassword />} />
      <Route path="/billing/success"    element={<CheckoutSuccess />} />
      <Route path="/integrations/callback/:platform" element={<OAuthCallback />} />

      {/* Private */}
      <Route path="/dashboard"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/campaigns"          element={<PrivateRoute><Campaigns /></PrivateRoute>} />
      <Route path="/campaigns/new"      element={<PrivateRoute><NewCampaign /></PrivateRoute>} />
      <Route path="/campaigns/:id"      element={<PrivateRoute><CampaignDetail /></PrivateRoute>} />
      <Route path="/assets"             element={<PrivateRoute><Assets /></PrivateRoute>} />
      <Route path="/copy"               element={<PrivateRoute><CopyPage /></PrivateRoute>} />
      <Route path="/audiences"          element={<PrivateRoute><AudiencesPage /></PrivateRoute>} />
      <Route path="/leads"               element={<PrivateRoute><Leads /></PrivateRoute>} />
      <Route path="/reports"             element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/integrations"       element={<PrivateRoute><Integrations /></PrivateRoute>} />
      <Route path="/billing"            element={<PrivateRoute><Billing /></PrivateRoute>} />

      <Route path="/admin"               element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
      <Route path="*"                   element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: { fontFamily: 'Rubik, sans-serif', direction: 'rtl', textAlign: 'right' },
            success: { iconTheme: { primary: '#2855f5', secondary: '#fff' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
