import React from 'react'
import { Sparkles } from 'lucide-react'

const LoadingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7fb]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(49,94,141,0.14),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(251,146,60,0.12),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef3fa_100%)]" />
      <div className="pointer-events-none absolute -top-12 left-10 h-40 w-40 rounded-full bg-[#315e8d]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-4 h-52 w-52 rounded-full bg-orange-300/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/75 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mx-auto mb-6 flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
              <Sparkles size={18} className="text-[#315e8d]" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-sm font-black tracking-tight text-slate-900">
                Dev<span className="text-[#315e8d]">Dash</span>
              </p>
              <p className="text-[11px] font-medium text-slate-500">Project Workspace</p>
            </div>
          </div>

          <div className="mx-auto mb-6 relative flex h-20 w-20 items-center justify-center">
            <div className="absolute h-20 w-20 rounded-full border-2 border-slate-200" />
            <div
              className="absolute h-20 w-20 rounded-full border-2 border-transparent border-t-[#315e8d] border-r-[#315e8d] animate-spin"
              style={{ animationDuration: '1s' }}
            />
            <div className="h-10 w-10 rounded-2xl bg-[#315e8d]/10 ring-1 ring-[#315e8d]/20" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Preparing your workspace</h2>
            <p className="mt-1.5 text-sm text-slate-600">Syncing projects, tasks, and team activity...</p>
          </div>

          <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#315e8d] via-[#3e74ad] to-[#315e8d]" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#315e8d]/65"
                style={{ animationDelay: `${i * 0.16}s`, animationDuration: '0.85s' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage