import React from 'react'
import { Sparkles } from 'lucide-react'

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#315e8d] flex items-center justify-center shadow-sm">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none">
              Dev<span className="text-[#315e8d]">Dash</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Project Management</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-white border border-[#dbe5f1] rounded-2xl px-10 py-8 shadow-sm flex flex-col items-center gap-5 w-72">

          {/* Spinner */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#e9f0f8]" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#315e8d] animate-spin" />
            <div className="w-7 h-7 rounded-lg bg-[#e9f0f8] flex items-center justify-center">
              <Sparkles size={13} className="text-[#315e8d]" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">Loading...</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Preparing your workspace</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#e9f0f8] rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[#315e8d] rounded-full animate-pulse" />
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#315e8d] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoadingPage