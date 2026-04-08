// import React, { useState, useEffect, useContext } from 'react'
// import { Check, Monitor, Moon, PanelLeft, PanelRight, Sun } from 'lucide-react'
// import LoadingPage from '../LoadingPage.jsx'   
// import {AppContext} from '../../context/AppContext.jsx'

// const AppearancePage = () => {

//     const {loading, setLoading}= useContext(AppContext);

//     const [theme, setTheme] = useState('system');
//     const [sidebarPosition, setSidebarPosition]= useState('left');

//     // ── Data ──
//   const themeOptions = [
//     { value: 'light', label: 'Light', icon: Sun },
//     { value: 'dark', label: 'Dark', icon: Moon },
//     { value: 'system', label: 'System', icon: Monitor },
//   ]

//   const handleSave= ()=>{
//     localStorage.setItem('theme', theme);
//     localStorage.setItem('sidebarPosition', sidebarPosition);
//     console.log('Appearance saved:', { theme, accentColor, sidebarPosition });
//   }

//   if(loading) return <LoadingPage />;
  
//   return (
//     <div>
//         {/* Page Header */}
//         <h2>Appearance</h2>
//         <p>Customize how DevDash looks for you.</p>

//         {/* ── Theme Selection Card ── */}
//         <div>
//             <h3>Theme</h3>
//             <p>Select your preferred color scheme.</p>
//             <div>
//                 {themeOptions.map((opt)=>{
//                     const Icon= opt.icon
//                     const isSelected= theme === opt.value;
//                     return (
//                         <button key={opt.value} onClick={() => setTheme(opt.value)}>
//                             <Icon size={28} />
//                             <span>{opt.label}</span>
//                             {isSelected && <Check size={14} />}
//                         </button>
//                     )
//                 })}
//             </div>
//         </div>

//         {/* ── Sidebar Position Card ── */}
//         <div>
//             <h3>Sidebar Position</h3>
//             <p>Choose where the dashboard sidebar appears.</p>
            
//             <div>
//                 {/* Left option */}
//                 <button onClick={() => setSidebarPosition('left')}>
//                     <PanelLeft size={24} />
//                     <span>Left</span>
//                 </button>

//                 {/* Right option */}
//                 <button onClick={() => setSidebarPosition('right')}>
//                     <PanelRight size={24} />
//                     <span>Right</span>
//                 </button>
//             </div>
//         </div>

//         {/* ── Save Button ── */}
//         <button onClick={handleSave}>Save Preferences</button>
//     </div>
//   )
// }

// export default AppearancePage


import React, { useState, useEffect, useContext } from 'react'
import { Check, Monitor, Moon, PanelLeft, PanelRight, Sun } from 'lucide-react'
import LoadingPage from '../LoadingPage.jsx'   
import {AppContext} from '../../context/AppContext.jsx'

const AppearancePage = () => {

    const [loading, setLoading]= useState(false);

    const [theme, setTheme] = useState('system');
    const [sidebarPosition, setSidebarPosition]= useState('left');

    // ── Data ──
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const handleSave= ()=>{
    localStorage.setItem('theme', theme);
    localStorage.setItem('sidebarPosition', sidebarPosition);
    console.log('Appearance saved:', { theme, accentColor, sidebarPosition });
  }

  if(loading) return <LoadingPage />;
  
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page Header */}
        <h2 className="text-2xl font-semibold text-slate-800">Appearance</h2>
        <p className="text-sm text-slate-500 -mt-4">Customize how DevDash looks for you.</p>

        {/* ── Theme Selection Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-700">Theme</h3>
            <p className="text-sm text-slate-500">Select your preferred color scheme.</p>
            <div className="flex gap-3">
                {themeOptions.map((opt)=>{
                    const Icon= opt.icon
                    const isSelected= theme === opt.value;
                    return (
                        <button key={opt.value} onClick={() => setTheme(opt.value)}
                            className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                                ${isSelected
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                                }`}>
                            <Icon size={28} />
                            <span className="text-sm font-medium">{opt.label}</span>
                            {isSelected && <Check size={14} className="text-indigo-500" />}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* ── Sidebar Position Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-700">Sidebar Position</h3>
            <p className="text-sm text-slate-500">Choose where the dashboard sidebar appears.</p>
            
            <div className="flex gap-3">
                {/* Left option */}
                <button onClick={() => setSidebarPosition('left')}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                        ${sidebarPosition === 'left'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                    <PanelLeft size={24} />
                    <span className="text-sm font-medium">Left</span>
                </button>

                {/* Right option */}
                <button onClick={() => setSidebarPosition('right')}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all
                        ${sidebarPosition === 'right'
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                        }`}>
                    <PanelRight size={24} />
                    <span className="text-sm font-medium">Right</span>
                </button>
            </div>
        </div>

        {/* ── Save Button ── */}
        <button onClick={handleSave}
            className="w-full py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            Save Preferences
        </button>
    </div>
  )
}

export default AppearancePage