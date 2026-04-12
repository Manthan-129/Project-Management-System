import React from 'react'
import { Sparkles } from 'lucide-react'

const LoadingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Ambient background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.25),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.22),transparent_34%),radial-gradient(circle_at_65%_80%,rgba(56,189,248,0.2),transparent_40%)]" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl animate-pulse" />
      <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-orange-400/15 blur-3xl animate-pulse" style={{ animationDelay: '0.8s' }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-6 relative flex h-24 w-24 items-center justify-center">
            <div className="absolute h-24 w-24 rounded-full border-2 border-cyan-200/25" />
            <div className="absolute h-24 w-24 rounded-full border-2 border-transparent border-t-cyan-300 border-r-orange-300 animate-spin" style={{ animationDuration: '1.3s' }} />
            <div className="absolute h-16 w-16 rounded-full border border-white/20" />
            <div className="absolute h-3 w-3 -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.8)]" />
            <div className="absolute h-3 w-3 top-1/2 -right-1.5 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(56,189,248,0.8)]" />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Sparkles size={20} className="text-cyan-100" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black tracking-[0.08em] text-white uppercase">
              Dev<span className="text-orange-300">Dash</span>
            </h2>
            <p className="mt-2 text-sm text-slate-200/90">Preparing your workspace experience...</p>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-300 to-orange-300 animate-pulse" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-cyan-200 animate-bounce"
                style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.85s' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage