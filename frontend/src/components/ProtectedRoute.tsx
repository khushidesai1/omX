import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authState } = useAuth()

  if (authState.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-primary/5 text-brand-text">
        Checking your session...
      </div>
    )
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/auth/sign-in" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
