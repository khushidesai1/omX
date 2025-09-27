import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import wordMark from '../assets/name.svg'
import { useAuth } from '../hooks/useAuth'

function SignIn() {
  const navigate = useNavigate()
  const { login, authState, clearError } = useAuth()
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate('/dashboard')
    }
  }, [authState.isAuthenticated, navigate])

  const combinedError = useMemo(() => localError || authState.error, [localError, authState.error])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    clearError()

    if (!formState.email.trim() || !formState.password.trim()) {
      setLocalError('Email and password are required.')
      return
    }

    setIsSubmitting(true)
    await login(formState.email.trim(), formState.password)
    setIsSubmitting(false)
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-brand-primary/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(158,184,160,0.25),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-10 md:flex-row md:items-center md:gap-12 md:px-8">
        <div className="flex flex-1 flex-col justify-center gap-8 text-center md:text-left">
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-semibold text-brand-primary">
            <img src={wordMark} alt="omX" className="h-10 w-auto" />
            <span className="hidden sm:inline">Return to home</span>
          </Link>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-brand-text">Welcome back.</h1>
            <p className="text-lg text-brand-body">
              Sign in with your omX workspace credentials to access projects, dashboards, and compute templates.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-brand-primary/20 bg-white/95 text-center shadow-xl backdrop-blur">
            <div className="space-y-2 border-b border-brand-primary/10 px-8 py-8">
              <h2 className="text-2xl font-semibold text-brand-text">Sign in to omX</h2>
              <p className="text-brand-body">
                Enter the email and password you used during registration.
              </p>
            </div>
            <div className="space-y-6 px-8 py-8">
              <form className="space-y-5 text-left" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-brand-text">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={(event) => {
                      setFormState((previous) => ({ ...previous, email: event.target.value }))
                      setLocalError(null)
                      clearError()
                    }}
                    placeholder="name@columbia.edu"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-semibold text-brand-text">
                      Password
                    </label>
                    <Link to="/auth/forgot-password" className="text-sm font-semibold text-brand-primary hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={formState.password}
                    onChange={(event) => {
                      setFormState((previous) => ({ ...previous, password: event.target.value }))
                      setLocalError(null)
                      clearError()
                    }}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                {combinedError && <p className="text-sm text-amber-600">{combinedError}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-brand-body">
                New to omX?{' '}
                <Link to="/auth/sign-up" className="font-semibold text-brand-primary hover:underline">
                  Request access
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn
