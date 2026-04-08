// import React, { useState, useEffect, useContext } from 'react'
// import { Eye, EyeOff, Search, Shield, Wifi } from 'lucide-react'
// import LoadingPage from '../LoadingPage'
// import {AppContext} from '../../context/AppContext.jsx'

// const PrivacyPage = () => {

//     const {loading, setLoading} = useContext(AppContext);

//     const [settings, setSettings]= useState({
//         profileVisibility: 'public',
//         showEmail: true,
//         showOnlineStatus: true,
//         showInSearch: true,
//     })

//     // ── Handlers ──
//     const handleToggleChange= (key)=>{
//         setSettings((prev)=> ({...prev, [key]: !prev[key]}));
//     }

//     const handleVisibilityChange= (value)=>{
//         setSettings((prev)=> ({...prev, profileVisibility: value}))
//     }

//     const handleSave= ()=>{
//         // API: PUT /api/auth/update-privacy { settings }
//         console.log('Privacy saved:', settings)
//     }

//     // ── Data ──

//     const visibilityOptions = [
//         { value: 'public', label: 'Public', desc: 'Anyone can view your profile' },
//         { value: 'team-only', label: 'Team Only', desc: 'Only your team members can see you' },
//         { value: 'private', label: 'Private', desc: 'Your profile is hidden from everyone' },
//     ]

//     const toggleItems = [
//         { key: 'showEmail', title: 'Show Email Address', desc: 'Allow teammates to see your email on your profile', icon: Eye },
//         { key: 'showOnlineStatus', title: 'Show Online Status', desc: 'Display green dot when you are active', icon: Wifi },
//         { key: 'showInSearch', title: 'Appear in Search', desc: 'Let others find you when searching for users', icon: Search },
//     ]

//     if (loading) return <LoadingPage />;
//   return (
//     <div>
//         {/* Page Header */}
//         <h2>Privacy</h2>
//         <p>Control who can see your information and how you appear to others.</p>

//         {/* ── Profile Visibility Card ── */}
//         <div>
//             <h3><Shield size={16} /> Profile Visibility</h3>
//             <p>Choose who can see your profile information.</p>

//             {/* Radio-style selection cards */}
//             <div>
//                 {visibilityOptions.map((option)=>(
//                     <button key={option.value} onClick={()=> handleVisibilityChange(option.value)}>
//                         {/* Radio indicator */}
//                         <div>
//                             {settings.profileVisibility === option.value ? "●" : ""}
//                         </div>  
//                         <div>
//                             <p>{option.label}</p>
//                             <p>{option.desc}</p>
//                         </div>
//                     </button>
//                 ))}
//             </div>
//         </div>

//         {/* ── Toggle Controls Card ── */}
//         <div>
//             <h3><EyeOff size={16} /> Visibility Controls</h3>

//             {toggleItems.map((item)=>{
//                 const Icon =item.icon;
//                 return (
//                     <div key= {item.key}>
//                         <div>
//                             <Icon size={16}></Icon>
//                             <div>
//                                 <p>{item.title}</p>
//                                 <p>{item.desc}</p>
//                             </div>
//                         </div>

//                         {/* Toggle switch */}
//                         <button onClick={()=> handleToggleChange(item.key)}> <span /></button>
//                     </div>
//                 )
//             })}
//         </div>
//         {/* ── Save Button ── */}
//         <button onClick={handleSave}>Save Privacy Settings</button>
//     </div>
//   )
// }

// export default PrivacyPage


import React, { useState, useEffect, useContext } from 'react'
import { Eye, EyeOff, Search, Shield, Wifi } from 'lucide-react'
import LoadingPage from '../LoadingPage'
import {AppContext} from '../../context/AppContext.jsx'

const PrivacyPage = () => {

    const [loading, setLoading]= useState(false);

    const [settings, setSettings]= useState({
        profileVisibility: 'public',
        showEmail: true,
        showOnlineStatus: true,
        showInSearch: true,
    })

    // ── Handlers ──
    const handleToggleChange= (key)=>{
        setSettings((prev)=> ({...prev, [key]: !prev[key]}));
    }

    const handleVisibilityChange= (value)=>{
        setSettings((prev)=> ({...prev, profileVisibility: value}))
    }

    const handleSave= ()=>{
        // API: PUT /api/auth/update-privacy { settings }
        console.log('Privacy saved:', settings)
    }

    // ── Data ──

    const visibilityOptions = [
        { value: 'public', label: 'Public', desc: 'Anyone can view your profile' },
        { value: 'team-only', label: 'Team Only', desc: 'Only your team members can see you' },
        { value: 'private', label: 'Private', desc: 'Your profile is hidden from everyone' },
    ]

    const toggleItems = [
        { key: 'showEmail', title: 'Show Email Address', desc: 'Allow teammates to see your email on your profile', icon: Eye },
        { key: 'showOnlineStatus', title: 'Show Online Status', desc: 'Display green dot when you are active', icon: Wifi },
        { key: 'showInSearch', title: 'Appear in Search', desc: 'Let others find you when searching for users', icon: Search },
    ]

    if (loading) return <LoadingPage />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page Header */}
        <h2 className="text-2xl font-semibold text-slate-800">Privacy</h2>
        <p className="text-sm text-slate-500 -mt-4">Control who can see your information and how you appear to others.</p>

        {/* ── Profile Visibility Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <Shield size={16} className="text-indigo-400" /> Profile Visibility
            </h3>
            <p className="text-sm text-slate-500">Choose who can see your profile information.</p>

            {/* Radio-style selection cards */}
            <div className="space-y-2.5">
                {visibilityOptions.map((option)=>(
                    <button key={option.value} onClick={()=> handleVisibilityChange(option.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                            ${settings.profileVisibility === option.value
                                ? 'border-indigo-400 bg-indigo-50'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                            }`}>
                        {/* Radio indicator */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                            ${settings.profileVisibility === option.value
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-slate-300 bg-white'
                            }`}>
                            {settings.profileVisibility === option.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${settings.profileVisibility === option.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {option.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* ── Toggle Controls Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <EyeOff size={16} className="text-indigo-400" /> Visibility Controls
            </h3>

            {toggleItems.map((item)=>{
                const Icon = item.icon;
                return (
                    <div key={item.key} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                                <Icon size={16} className="text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">{item.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                        </div>

                        {/* Toggle switch */}
                        <button onClick={()=> handleToggleChange(item.key)}
                            className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${settings[item.key] ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                )
            })}
        </div>

        {/* ── Save Button ── */}
        <button onClick={handleSave}
            className="w-full py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            Save Privacy Settings
        </button>
    </div>
  )
}

export default PrivacyPage