import { Link } from 'react-router-dom'

import wordMark from '../assets/name.svg'

const featureHighlights = [
  {
    title: 'Unified Workspaces',
    description:
      'Switch across projects, datasets, and dashboards without losing context. Real-time sync keeps every collaborator aligned.',
    status: 'available',
  },
  {
    title: 'High-Resolution Explorers',
    description:
      'Progressive imagery streaming, layered annotations, and cross-filtered dashboards that feel instantaneous—even at Xenium scale.',
    status: 'available',
  },
  {
    title: 'Developer + No-Code Pipelines',
    description:
      'Custom preprocessing recipes with notebook-style editing and reusable task blocks for automation and reproducibility.',
    status: 'coming-soon',
  },
  {
    title: 'RunPod-Powered Compute',
    description:
      'Templated CPU/GPU environments with cost estimates and inline telemetry, so you can spin up runs with total confidence.',
    status: 'coming-soon',
  },
]

const snapshotHighlights = [
  {
    title: 'Shared workspaces',
    body: 'Invite cross-functional teams into a single source of truth with granular roles, audit trails, and instant sync.',
    tag: 'Invite & RBAC',
  },
  {
    title: 'Modular dashboards',
    body: 'Compose reusable visualization blocks—drag-and-drop panels or drop into code when you need deeper control.',
    tag: 'Drag + Code',
  },
  {
    title: 'Collaborator sharing',
    body: 'Publish explorers, annotations, and notes for partners with secure links, comments, and scheduled digests.',
    tag: 'Share & Review',
  },
]

const integrationTiles = [
  {
    title: 'RunPod Compute',
    body: 'Launch templated CPU/GPU runs with guardrails. Inline estimates keep budgets predictable while queues expose live telemetry.',
  },
  {
    title: 'Storage & Data',
    body: 'Attach GCS buckets, signed object storage, and notebook artifacts with a secure access key workflow and audit logging.',
  },
  {
    title: 'Custom Extensions',
    body: 'Use Plot Blocks and explorer SDKs to embed your own analytics flows. Publish reusable components across workspaces.',
  },
]

function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-white via-brand-primary/10 to-white text-brand-text">
      <header className="border-b border-brand-primary/20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center">
            <img src={wordMark} alt="omX" className="h-10 w-auto" />
          </div>
          <nav className="hidden items-center gap-8 text-sm   font-medium text-brand-body md:flex">
            <a href="#features" className="transition-colors hover:text-brand-primary">
              Features
            </a>
            <a href="#workflows" className="transition-colors hover:text-brand-primary">
              Workflows
            </a>
            <a href="#integrations" className="transition-colors hover:text-brand-primary">
              Integrations
            </a>
            <a href="#contact" className="transition-colors hover:text-brand-primary">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/auth/sign-in"
              className="hidden rounded-full px-6 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/15 md:inline-flex"
            >
              Sign In
            </Link>
            <Link
              to="/auth/sign-up"
              className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center px-6 py-16 text-center md:px-0">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary/80">
              Multi-omics intelligence, orchestrated
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Explore, visualize, and interact with high-throughput data without leaving your workspace.
            </h1>
            <p className="text-lg leading-relaxed text-brand-body">
              omX unifies developer-friendly tooling with approachable, no-code UI dashboards. Streamline spatial transcriptomics visualization with custom allocated compute, and keep your collaborators in sync—no context switching required.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-primary px-8 text-base font-semibold text-white transition-colors hover:bg-brand-primary-dark"
              >
                Request Access
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-primary px-8 text-base font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
              >
                Explore Platform
              </a>
            </div>
          </div>

          <div className="relative mt-14 w-full max-w-5xl overflow-hidden rounded-[32px] border border-brand-primary/20 bg-white/95 shadow-xl ring-1 ring-brand-primary/15">
            <div className="grid gap-4 bg-gradient-to-br from-white via-brand-primary/15 to-transparent p-8 text-left">
              <div className="grid gap-2 text-brand-body">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-primary/80">
                  Platform Snapshot
                </span>
                <h2 className="text-2xl font-semibold text-brand-text">
                  One platform for data visualization and dashboards
                </h2>
                <p>
                  Create dashboards, visualize data, and share static and interactive plots with your team. omX keeps everything versioned and auditable.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {snapshotHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-col gap-3 rounded-2xl border border-brand-primary/20 bg-white/90 p-4 text-brand-body shadow-sm"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">
                      {item.tag}
                    </span>
                    <h3 className="text-lg font-semibold text-brand-text">{item.title}</h3>
                    <p className="text-sm leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-brand-primary/20 bg-white/90 p-4 text-brand-body shadow-sm">
                <p className="text-sm font-semibold text-brand-text">Seamless collaboration</p>
                <p className="text-sm">
                  Comment threads, shareable snapshots, and weekly digests keep every collaborator aligned without leaving omX.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white/70 py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 md:grid-cols-2 md:px-0">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className={`group flex flex-col gap-3 rounded-3xl border p-8 shadow-sm transition ${
                  feature.status === 'coming-soon'
                    ? 'border-brand-primary/10 bg-white/70 text-brand-body'
                    : 'border-brand-primary/20 bg-white text-brand-body hover:-translate-y-1 hover:shadow-xl'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-brand-primary/15" />
                <h3 className="text-2xl font-semibold text-brand-text">{feature.title}</h3>
                <p className="text-base leading-relaxed text-brand-body">{feature.description}</p>
                {feature.status === 'coming-soon' && (
                  <span className="inline-flex w-fit rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">
                    Coming Soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="workflows" className="border-y border-brand-primary/20 bg-gradient-to-br from-white via-brand-primary/10 to-white py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-center md:px-0">
            <div className="flex-1 space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary/80">
                Orchestrate every workflow
              </p>
              <h2 className="text-3xl font-semibold md:text-4xl">
                From data ingestion to exploratory dashboards—built for cross-functional teams.
              </h2>
              <ul className="space-y-4 text-base text-brand-body">
                <li>
                  <span className="font-semibold text-brand-text">Workspaces:</span> manage visibility, access keys, and version history with granular RBAC.
                </li>
                <li>
                  <span className="font-semibold text-brand-text">Projects:</span> tag resources, mount storage, and launch compute templates with instant cost previews.
                </li>
                <li>
                  <span className="font-semibold text-brand-text">Dashboards:</span> drag, resize, or publish reusable plot blocks with a single click.
                </li>
              </ul>
              <div className="flex flex-wrap gap-3">
                {['Workspaces', 'Projects', 'Dashboards', 'Explorers', 'Compute'].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-brand-primary/30 bg-white px-4 py-1.5 text-sm font-medium text-brand-primary"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-3xl border border-brand-primary/20 bg-white/90 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-brand-text">Trusted orchestration</h3>
                <p className="mt-2 text-brand-body">
                  Real-time session sync, audit logging, and RunPod queues keep every pipeline observable. With Query caching and progressive explorers, even Xenium datasets stay fluid.
                </p>
                <div className="mt-6 space-y-4 text-brand-body">
                  <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/10 p-4">
                    <p className="text-sm font-semibold text-brand-primary">Inline Cost Estimate</p>
                    <p className="mt-1 text-sm">
                      Configure GPUs, memory, and runtime and watch pricing adjust instantly.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-brand-primary/20 bg-white p-4">
                    <p className="text-sm font-semibold text-brand-primary">Versioned Dashboards</p>
                    <p className="mt-1 text-sm">
                      Publish plot blocks, fork notebooks, and roll back when inspiration strikes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="bg-white py-20">
          <div className="mx-auto w-full max-w-6xl px-6 md:px-0">
            <div className="flex flex-col items-center text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary/80">
                Seamless integrations
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-brand-text md:text-4xl">
                Connect storage, compute, and analytics without custom glue code.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-brand-body">
                omX ships with opinionated defaults—RunPod for GPU orchestration, S3-compatible storage mounts, Xenium explorers, and signed download URLs. Extend the platform via REST + WebSocket APIs or drop in your own feature-flagged modules.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {integrationTiles.map((tile) => (
                <div key={tile.title} className="rounded-3xl border border-brand-primary/20 bg-white p-6 text-left shadow-sm">
                  <h3 className="text-lg font-semibold text-brand-text">{tile.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-brand-body">{tile.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-brand-primary/20 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-brand-body md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-brand-text">Ready to modernize your multi-omics workflows?</p>
            <p>Reach out for onboarding support or to join the next private preview cohort.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="mailto:team@omx.bio"
              className="rounded-full border border-brand-primary px-6 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/15"
            >
              Email the team
            </a>
            <Link
              to="/auth/sign-up"
              className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark"
            >
              Join waitlist
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
