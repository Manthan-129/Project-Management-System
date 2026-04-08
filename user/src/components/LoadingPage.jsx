// import React from 'react'

// const LoadingPage = () => {
//   return (
//     <div className="flex items-center justify-center min-h-screen">
      
//       <div className="flex flex-col items-center gap-4">

//         {/* Spinner */}
//         <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>

//         {/* Loading text */}
//         <p className="text-gray-600 text-sm">Loading, please wait...</p>

//       </div>

//     </div>
//   )
// }

// export default LoadingPage

import React from 'react'
import { Sparkles } from 'lucide-react'

const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">

      <div className="flex flex-col items-center gap-6">

        {/* Animated logo mark */}
        <div className="relative flex items-center justify-center w-20 h-20">

          {/* Outer rotating ring */}
          <div className="absolute w-20 h-20 rounded-full border-4 border-slate-200 border-t-indigo-500 border-r-indigo-300 animate-spin" style={{ animationDuration: '1.2s' }}></div>

          {/* Inner pulsing circle */}
          <div className="absolute w-12 h-12 bg-indigo-50 rounded-full animate-pulse"></div>

          {/* Center icon */}
          <Sparkles size={20} className="text-indigo-500 relative z-10" />

        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-bold text-slate-800">Dev<span className="text-indigo-500">Dash</span></h2>
          <p className="text-sm text-slate-400">Loading, please wait...</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i}
              className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
            />
          ))}
        </div>

      </div>

    </div>
  )
}

export default LoadingPage