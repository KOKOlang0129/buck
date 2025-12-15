import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from '@/components/providers/MockAuthProvider'
import Layout from '@/components/Layout'
import EditorPage from '@/pages/EditorPage'
import DashboardPage from '@/pages/DashboardPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import React from 'react'
import { AUTH_UNAUTHORIZED_EVENT } from '@/utils/authRedirect'
import { useAuth } from '@/components/providers/MockAuthProvider'

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectToIndex = React.useCallback(() => {
    if (location.pathname !== '/') {
      navigate('/', { replace: true })
    }
  }, [location.pathname, navigate])

  React.useEffect(() => {
    if (!loading) {
      const requiresAuth = ['/editor', '/dashboard'].some(path =>
        location.pathname.startsWith(path)
      )
      if (requiresAuth && !user) {
        redirectToIndex()
      }
    }
  }, [loading, user, location.pathname, redirectToIndex])

  React.useEffect(() => {
    const handleUnauthorized = async () => {
      try {
        await signOut()
      } finally {
        redirectToIndex()
      }
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [redirectToIndex, signOut])

  React.useEffect(() => {
    // Fetchインターセプト（401/403を検知して共通イベント発火）
    if ((window as any).__authFetchPatched) return
    const originalFetch = window.fetch
    ;(window as any).__authFetchPatched = true

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
      }
      return response
    }
  }, [])

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <AuthGuard>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout />}>
              {/* <Route index element={<HomePage />} /> */}
              <Route index element={<LoginPage />} />
              {/* <Route path="login" element={<LoginPage />} /> */}
              <Route path="register" element={<RegisterPage />} />
              <Route path="editor" element={<EditorPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </AuthGuard>
      </div>
    </AuthProvider>
  )
}

export default App
