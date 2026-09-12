import React from 'react'
import { Sparkles } from 'lucide-react'

const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xs">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none tracking-tight">
              Dev<span className="text-indigo-600">Dash</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Project Management</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-10 py-8 shadow-[0_4px_24px_rgba(15,23,42,0.04)] backdrop-blur-md flex flex-col items-center gap-5 w-72">

          {/* Spinner */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-50" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
            <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Sparkles size={13} className="text-indigo-600" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Loading...</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Preparing your workspace</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-pulse" />
          </div>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"
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