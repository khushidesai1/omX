import { Link } from 'react-router-dom'

import wordMark from '../assets/name.svg'

function ForgotPassword() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-primary/10 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-brand-primary/20 bg-white/95 p-8 text-center shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-brand-primary">
          <img src={wordMark} alt="omX" className="h-8 w-auto" />
          <span className="text-sm font-medium text-brand-body">Reset your password</span>
        </div>
        <p className="text-sm text-brand-body">
          Enter the email associated with your omX account and we&apos;ll send a secure reset link.
        </p>
        <form className="mt-8 space-y-4 text-left">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-brand-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@organization.com"
              required
              className="mt-2 w-full rounded-xl border border-brand-primary/30 bg-white px-4 py-3 text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <button className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
            Send reset link
          </button>
        </form>
        <div className="mt-6 text-sm text-brand-body">
          Remembered your password?{' '}
          <Link to="/auth/sign-in" className="font-semibold text-brand-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
