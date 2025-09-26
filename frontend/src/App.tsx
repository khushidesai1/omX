import iconMark from './assets/icon.svg'
import wordMark from './assets/name.svg'

function App() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <img src={iconMark} alt="omX icon" className="h-12 w-12" />
          <img src={wordMark} alt="omX" className="h-8" />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-[#2E5D3D] px-5 py-2 text-sm font-medium text-[#2E5D3D] transition-colors duration-200 hover:bg-[#2E5D3D]/10"
          >
            Sign Up
          </button>
          <button
            type="button"
            className="rounded-full bg-[#2E5D3D] px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#2B5437]"
          >
            Log In
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 text-center">
        <section className="space-y-6">
          <h1 className="text-3xl font-light text-[#1F1F1F] sm:text-4xl">
            <span className="font-semibold">Process</span> and{' '}
            <span className="font-semibold">visualize</span> with the click of a few buttons...
          </h1>
          <p className="mx-auto max-w-3xl text-base text-[#5A5A5A] sm:text-lg">
            Create your central dashboard for processing, visualizing and annotating high-throughput
            multi-omics data through customized developer-friendly and code-free pipelines.
          </p>
        </section>

        <section className="mt-16 w-full">
          <div className="mx-auto max-w-4xl rounded-[32px] bg-[#9CB29A] p-6 sm:p-10">
            <div className="aspect-[4/3] w-full rounded-[24px] bg-[#ECECEC] shadow-[0_8px_20px_rgba(0,0,0,0.1)]"></div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
