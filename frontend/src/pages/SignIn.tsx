import { Link } from 'react-router-dom'

import wordMark from '../assets/name.svg'

const highlightTiles = [
  { label: 'Columbia SSO verified', value: '@columbia.edu' },
  { label: 'Invitation token', value: 'Required' },
  { label: 'Session timeout', value: '2 hours' },
]

function SignIn() {
  return (
    <div className="relative flex min-h-screen flex-col bg-brand-primary/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(158,184,160,0.25),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-10 md:flex-row md:items-stretch md:gap-12 md:px-8">
        <div className="flex flex-1 flex-col justify-center gap-8 text-center md:text-left">
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-semibold text-brand-primary">
            <img src={wordMark} alt="omX" className="h-10 w-auto" />
            <span className="hidden sm:inline">Return to home</span>
          </Link>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-brand-text">Welcome back.</h1>
            <p className="text-lg text-brand-body">
              Sign in with Columbia SSO or your invite-only omX credentials to access workspaces, dashboards, and compute templates.
            </p>
          </div>
          <div className="hidden w-full overflow-hidden rounded-3xl border border-brand-primary/20 bg-white/80 p-6 shadow-xl md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary/80">Sign-in glance</p>
            <div className="mt-4 grid gap-3 text-sm text-brand-body">
              {highlightTiles.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-brand-primary/20 bg-white/90 px-4 py-3"
                >
                  <span className="font-medium text-brand-text">{item.label}</span>
                  <span className="rounded-full bg-brand-primary/15 px-3 py-1 text-xs font-semibold text-brand-primary">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-brand-primary/20 bg-white/90 text-center shadow-xl backdrop-blur">
            <div className="space-y-2 border-b border-brand-primary/10 px-8 py-8">
              <h2 className="text-2xl font-semibold text-brand-text">Sign in to omX</h2>
              <p className="text-brand-body">
                Use your Columbia Google account or your invite credentials.
              </p>
            </div>
            <div className="space-y-6 px-8 py-8">
              <button className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-primary/30 px-4 py-3 text-sm font-semibold text-brand-text transition hover:bg-brand-primary/15">
                <svg className="h-4 w-4" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path
                    fill="#4285f4"
                    d="M533.5 278.4a320.1 320.1 0 0 0-4.7-56.5H272.1v106.8h147.2c-6.3 34.3-25 63.4-53.3 82.9v68.9h86.2c50.5-46.5 80.8-115.1 80.8-202.1z"
                  />
                  <path
                    fill="#34a853"
                    d="M272.1 544.3c72.1 0 132.5-23.8 176.7-65l-86.2-68.9c-24.1 16.2-55 25.6-90.5 25.6-69.5 0-128.3-46.5-149.3-108.7H33.4v68.9c44.1 87.2 134.4 148.1 238.7 148.1z"
                  />
                  <path
                    fill="#fbbc04"
                    d="M122.8 327.3a164.7 164.7 0 0 1 0-110.2V148.2H33.4a272.5 272.5 0 0 0 0 247.9z"
                  />
                  <path
                    fill="#ea4335"
                    d="M272.1 107.7c39.1-.6 75.2 13.2 103.2 38.5l77-77C397.5 24.4 338-0.1 272.1 0 167.8 0 77.5 60.9 33.4 148.2l89.4 68.9C143.8 169.9 202.6 123.4 272.1 123.4z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 text-xs uppercase tracking-[0.4em] text-brand-muted">
                <span className="h-px flex-1 bg-brand-primary/20" />
                or
                <span className="h-px flex-1 bg-brand-primary/20" />
              </div>

              <form className="space-y-5 text-left">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-brand-text">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@columbia.edu"
                    required
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
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <button className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
                  Sign In
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
