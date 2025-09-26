import { Link } from 'react-router-dom'

import wordMark from '../assets/name.svg'

function SignUp() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-brand-primary/10 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(158,184,160,0.2),transparent_55%)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-10 md:flex-row md:items-stretch md:gap-12 md:px-8">
        <div className="order-2 mt-10 w-full max-w-md border border-brand-primary/20 bg-white/95 text-center shadow-xl backdrop-blur md:order-1 md:mt-0 md:rounded-3xl">
          <div className="space-y-2 border-b border-brand-primary/10 px-8 py-8">
            <h2 className="text-2xl font-semibold text-brand-text">Request omX access</h2>
            <p className="text-brand-body">
              Invitations are required for external collaborators. Columbia users can sign in directly with Google.
            </p>
          </div>
          <div className="space-y-4 px-8 py-8 text-left">
            {[
              { id: 'name', label: 'Full name', type: 'text', placeholder: 'Ada Lovelace' },
              { id: 'email', label: 'Work email', type: 'email', placeholder: 'you@organization.com' },
              { id: 'affiliation', label: 'Affiliation', type: 'text', placeholder: 'Columbia University' },
              { id: 'invitation', label: 'Invitation code (optional)', type: 'text', placeholder: 'Enter invite token' },
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <label htmlFor={field.id} className="text-sm font-semibold text-brand-text">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
                  required={field.id !== 'invitation'}
                />
              </div>
            ))}
            <button className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
              Submit request
            </button>
            <p className="text-center text-sm text-brand-body">
              Been invited already?{' '}
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
