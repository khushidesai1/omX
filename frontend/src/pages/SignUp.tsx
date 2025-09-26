import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import wordMark from '../assets/name.svg'
import { useAuth } from '../hooks/useAuth'

function SignUp() {
  const navigate = useNavigate()
  const { register, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [eligibility, setEligibility] = useState<'idle' | 'eligible' | 'ineligible'>('idle')
  const [requestSent, setRequestSent] = useState(false)
  const [accountAttempted, setAccountAttempted] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  const resetDecisions = () => {
    setEligibility('idle')
    setRequestSent(false)
    setAccountAttempted(false)
    setRegisterError(null)
    setIsRegistering(false)
    setCheckError(null)
  }

  const handleCheckAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAccountAttempted(false)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setEligibility('idle')
      setCheckError('Please enter your email before checking.')
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL
    if (!apiBaseUrl) {
      setCheckError('API base URL is not configured.')
      return
    }

    setIsChecking(true)
    setCheckError(null)

    try {
      const response = await fetch(`${apiBaseUrl}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      if (!response.ok) {
        throw new Error('Unable to verify email eligibility right now.')
      }

      const data: { eligible: boolean } = await response.json()
      setEligibility(data.eligible ? 'eligible' : 'ineligible')
      setRequestSent(false)
      setRegisterError(null)
      setIsRegistering(false)

      if (!data.eligible) {
        setFullName('')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      setEligibility('idle')
      setCheckError(error instanceof Error ? error.message : 'Unable to verify email eligibility right now.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleRequestAccess = () => {
    setRequestSent(true)
  }

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    setAccountAttempted(false)
    setRegisterError(null)

    if (password.trim().length < 8) {
      setRegisterError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setRegisterError('Passwords do not match.')
      return
    }

    setIsRegistering(true)
    const [firstName, ...rest] = fullName.trim().split(' ')
    const lastName = rest.join(' ')
    const normalizedEmail = email.trim().toLowerCase()

    try {
      await register({
        email: normalizedEmail,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      })
      setAccountAttempted(true)
      setTimeout(() => {
        navigate('/workspaces')
      }, 900)
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Unable to create account.')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-brand-primary/10 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(158,184,160,0.2),transparent_55%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-10 md:flex-row md:items-stretch md:gap-12 md:px-8">
        <div className="order-2 mt-10 w-full max-w-md border border-brand-primary/20 bg-white/95 text-center shadow-xl backdrop-blur md:order-1 md:mt-0 md:rounded-3xl">
          <div className="space-y-2 border-b border-brand-primary/10 px-8 py-8">
            <h2 className="text-2xl font-semibold text-brand-text">Create your omX account</h2>
            <p className="text-brand-body">
              We approve access based on institutional partnerships. Start by checking if your work email is on our allow list.
            </p>
          </div>
          <div className="space-y-6 px-8 py-8 text-left">
            <form className="space-y-4" onSubmit={handleCheckAccess}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-brand-text">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (eligibility !== 'idle') {
                      resetDecisions()
                    }
                  }}
                  placeholder="you@organization.com"
                  className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isChecking}
                className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChecking ? 'Checking…' : 'Check email status'}
              </button>
            </form>

            {checkError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {checkError}
              </div>
            )}

            {eligibility !== 'idle' && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  eligibility === 'eligible'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {eligibility === 'eligible'
                  ? 'Great news! This email is eligible for access — finish creating your account below.'
                  : 'This email is not yet approved. You can request access and our team will follow up quickly.'}
              </div>
            )}

            {eligibility === 'eligible' && (
              <form className="space-y-4" onSubmit={handleCreateAccount}>
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-semibold text-brand-text">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-brand-text">
                    Create password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 12 characters"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-brand-text">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                    required
                  />
                </div>
                {registerError && <p className="text-sm text-amber-600">{registerError}</p>}
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRegistering ? 'Creating account…' : 'Create account'}
                </button>
                {accountAttempted && (
                  <p className="text-sm text-brand-body">
                    Account ready! We will take you to workspace setup.
                  </p>
                )}
              </form>
            )}

            {eligibility === 'ineligible' && (
              <div className="space-y-4 rounded-2xl bg-brand-primary/5 p-4">
                <button
                  type="button"
                  onClick={handleRequestAccess}
                  className="w-full rounded-full border border-brand-primary bg-white px-6 py-3 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10"
                >
                  Request access from omX team
                </button>
                {requestSent ? (
                  <p className="text-sm text-brand-body">
                    Request sent! We will review and respond within two business days.
                  </p>
                ) : (
                  <p className="text-sm text-brand-body">
                    Not on the list yet? Send a request and we will verify your project details.
                  </p>
                )}
              </div>
            )}

            <p className="text-center text-sm text-brand-body">
              Already activated?{' '}
              <Link to="/auth/sign-in" className="font-semibold text-brand-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="order-1 flex flex-1 flex-col justify-center gap-8 text-center md:order-2 md:text-left">
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-semibold text-brand-primary">
            <img src={wordMark} alt="omX" className="h-10 w-auto" />
            <span className="hidden sm:inline">Return to home</span>
          </Link>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-brand-text">Unlock collaborative omics workflows.</h1>
            <p className="text-lg text-brand-body">
              Create workspaces, organize projects, and launch GPU-backed compute with confidence. We onboard new teams in cohorts to ensure security and support.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-primary/20 bg-white/85 p-6 shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-primary/80">
              What to expect
            </p>
            <ul className="mt-4 space-y-3 text-left text-brand-body">
              <li>• Invite approval within 2 business days.</li>
              <li>• Guided workspace setup and access key rotation.</li>
              <li>• Optional RunPod compute credits for pilot projects.</li>
            </ul>
          </div>
          <div className="hidden rounded-3xl border border-brand-primary/20 bg-white/80 p-6 shadow-xl md:block">
            <div className="grid gap-3 text-left text-sm text-brand-body">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-text">Workspace visibility</span>
                <span className="rounded-full bg-brand-primary/15 px-3 py-1 text-xs font-semibold text-brand-primary">
                  Private · Columbia-only
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-text">Access key rotation</span>
                <span className="rounded-full bg-brand-primary/15 px-3 py-1 text-xs font-semibold text-brand-primary">
                  Supported
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-text">RunPod credits</span>
                <span className="rounded-full bg-brand-primary/15 px-3 py-1 text-xs font-semibold text-brand-primary">
                  Optional pilots
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
