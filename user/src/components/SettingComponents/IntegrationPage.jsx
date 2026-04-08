// import React, { useState } from 'react'
// import { Github, GitlabIcon, Info, Link, Unlink } from 'lucide-react'

// const IntegrationPage = () => {

//     const [connections, setConnections] = useState({
//         github: {connected: false, username: '', lastSynced: null, autoSync: false},
//         gitlab: { connected: false, username: '', lastSynced: null, autoSync: false },
//     bitbucket: { connected: false, username: '', lastSynced: null , autoSync: false},
//     })

//     const platforms= [
//         { key: 'github', name: 'GitHub', icon: Github, description: 'Link your GitHub account to sync repositories and pull requests.' },
//     { key: 'gitlab', name: 'GitLab', icon: GitlabIcon, description: 'Connect GitLab to import merge requests and projects.' },
//     { key: 'bitbucket', name: 'Bitbucket', icon: Link, description: 'Link Bitbucket to sync your repositories.' },
//     ]

//     const handleConnect= (platform)=>{

//         // Real app: redirect to OAuth flow
//         // window.location.href = `${backendUrl}/api/auth/${platform}/connect`
//         console.log('Connecting to', platform)
        
//         // Mock: simulate connection

//         setConnections((prev) => ({
//             ...prev, [platform]:{
//                 ...prev[platform],
//                 connected: true,
//                 username: 'mock-user',
//                 lastSynced: new Date().toISOString(),
//             }
//         }))
//     }

//     const handleDisconnect= (platform)=>{
//         // API: POST /api/auth/disconnect/:platform
//     console.log('Disconnecting from', platform)

//     setConnections((prev)=> ({
//         ...prev, 
//         [platform]: {...prev[platform],connected: false, username: '', lastSynced: null, autoSync: false}
//     }))

//     }

//     const handleToggleAutoSync = (platform)=>{
//         setConnections((prev)=>({
//             ...prev,
//             [platform]:{
//                 ...prev[platform],
//                 autoSync: !prev[platform].autoSync
//             }
//         }))
//     }

//     const formatDate= (dateStr)=>{
//         if(!dateStr) return 'Never'

//         return new Date(dateStr).toLocaleString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     })
//     }
//   return (
//     <div>
//         {/* Page Header */}
//       <h2>Connected Accounts</h2>
//       <p>Link external services to sync repositories and pull requests.</p>

//       {/* ── Platform Cards ── */}
//       {platforms.map((platform)=>{
//         const Icon= platform.icon;
//         const conn= connections[platform.key];
//         const syncing= conn.connected && conn.autoSync;
//         return (
//             <div key={platform.key}>
//                  {/* Top: Platform Info + Button */}
//                 <div>
//                     <div>
//                         <Icon size={24} />
//                         <div>
//                             <div>
//                                 <h3>{platform.name}</h3>
//                                 <span>{conn.connected ? 'Connected' : 'Not Connected'}</span>
//                             </div>
//                             <p>{platform.description}</p>
//                         </div>
//                     </div>

//                     {/* Connect / Disconnect */}
//                     {conn.connected ? (
//                 <button onClick={() => handleDisconnect(platform.key)}>
//                   <Unlink size={14} />
//                   Disconnect
//                 </button>
//               ) : (
//                 <button onClick={() => handleConnect(platform.key)}>
//                   <Link size={14} />
//                   Connect
//                 </button>
//               )}
//                 </div>

//                 {/* Connected Details */}
//                 {conn.connected && (
//                     <div>
//                         <div>
//                             <span>Username</span>
//                             <span>@{conn.username}</span>
//                         </div>
//                         <div>
//                             <span>Last Synced</span>
//                   <span>{formatDate(conn.lastSynced)}</span>
//                         </div>
//                         <div>
//                             <span>Auto Sync PRs</span>
//                             <button onClick={()=> handleToggleAutoSync(platform.key)}>
//                                 <span />
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         )
//       })}

//       {/* ── Info Card ── */}
//       <div>
//         <Info size={18} />
//         <div>
//           <p>About Integrations</p>
//           <p>
//             Connecting your accounts allows DevDash to import pull requests and repository data.
//             We only request read access. You can disconnect at any time.
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default IntegrationPage


import React, { useState } from 'react'
import { Github, GitlabIcon, Info, Link, Unlink } from 'lucide-react'

const IntegrationPage = () => {

    const [connections, setConnections] = useState({
        github: {connected: false, username: '', lastSynced: null, autoSync: false},
        gitlab: { connected: false, username: '', lastSynced: null, autoSync: false },
    bitbucket: { connected: false, username: '', lastSynced: null , autoSync: false},
    })

    const platforms= [
        { key: 'github', name: 'GitHub', icon: Github, description: 'Link your GitHub account to sync repositories and pull requests.' },
    { key: 'gitlab', name: 'GitLab', icon: GitlabIcon, description: 'Connect GitLab to import merge requests and projects.' },
    { key: 'bitbucket', name: 'Bitbucket', icon: Link, description: 'Link Bitbucket to sync your repositories.' },
    ]

    const handleConnect= (platform)=>{
        console.log('Connecting to', platform)
        setConnections((prev) => ({
            ...prev, [platform]:{
                ...prev[platform],
                connected: true,
                username: 'mock-user',
                lastSynced: new Date().toISOString(),
            }
        }))
    }

    const handleDisconnect= (platform)=>{
    console.log('Disconnecting from', platform)
    setConnections((prev)=> ({
        ...prev, 
        [platform]: {...prev[platform],connected: false, username: '', lastSynced: null, autoSync: false}
    }))
    }

    const handleToggleAutoSync = (platform)=>{
        setConnections((prev)=>({
            ...prev,
            [platform]:{
                ...prev[platform],
                autoSync: !prev[platform].autoSync
            }
        }))
    }

    const formatDate= (dateStr)=>{
        if(!dateStr) return 'Never'
        return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page Header */}
      <h2 className="text-2xl font-semibold text-slate-800">Connected Accounts</h2>
      <p className="text-sm text-slate-500 -mt-4">Link external services to sync repositories and pull requests.</p>

      {/* ── Platform Cards ── */}
      {platforms.map((platform)=>{
        const Icon= platform.icon;
        const conn= connections[platform.key];
        const syncing= conn.connected && conn.autoSync;
        return (
            <div key={platform.key} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

                 {/* Top: Platform Info + Button */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl">
                            <Icon size={24} className="text-slate-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-slate-800">{platform.name}</h3>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conn.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {conn.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{platform.description}</p>
                        </div>
                    </div>

                    {/* Connect / Disconnect */}
                    {conn.connected ? (
                        <button onClick={() => handleDisconnect(platform.key)}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors whitespace-nowrap">
                            <Unlink size={14} />
                            Disconnect
                        </button>
                    ) : (
                        <button onClick={() => handleConnect(platform.key)}
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors whitespace-nowrap">
                            <Link size={14} />
                            Connect
                        </button>
                    )}
                </div>

                {/* Connected Details */}
                {conn.connected && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Username</span>
                            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">@{conn.username}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Last Synced</span>
                            <span className="text-xs text-slate-600">{formatDate(conn.lastSynced)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Auto Sync PRs</span>
                            <button onClick={()=> handleToggleAutoSync(platform.key)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${conn.autoSync ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${conn.autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
      })}

      {/* ── Info Card ── */}
      <div className="flex gap-3 p-4 bg-sky-50 border border-sky-100 rounded-2xl">
        <Info size={18} className="text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">About Integrations</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connecting your accounts allows DevDash to import pull requests and repository data.
            We only request read access. You can disconnect at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default IntegrationPage